import Grievance from '../models/Grievance.js';
import generateWithGemini from '../utils/geminiService.js';

const ESCALATION_DAYS = 3;

// checks all still-open grievances and flips escalated:true if they're past the threshold.
// called at the top of getAssignedGrievances — so it runs "on view", not on a timer.
const runEscalationCheck = async () => {
  const cutoff = new Date(Date.now() - ESCALATION_DAYS * 24 * 60 * 60 * 1000);

  await Grievance.updateMany(
    {
      status: { $in: ['Pending', 'In Progress'] }, // only unresolved ones can escalate
      escalated: false,                             // don't re-escalate ones already flagged
      createdAt: { $lte: cutoff },                   // filed 3+ days ago
    },
    {
      $set: { escalated: true, escalatedAt: new Date() },
    }
  );
};



// create a new grievance (student only)
export const createGrievance = async (req, res) => {
  try {
    const { title, description, category, priority, publishToCommunity } = req.body;

    const newGrievance = new Grievance({
      student: req.student._id,
      title,
      description,
      category,
      priority,
      publishToCommunity,
    });
    const savedGrievance = await newGrievance.save();
    res.status(201).json(savedGrievance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// get all grievances filed by the logged-in student
export const getMyGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find({ student: req.student._id }).sort({ createdAt: -1 });
    res.status(200).json(grievances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommunityGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find({ publishToCommunity: true })
      .populate('student', 'nameAadhar department')
      .sort({ createdAt: -1 });
    res.status(200).json(grievances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// get grievances assigned to the logged-in staff member
// HOD sees all NON-escalated ones here; Lecturer/Warden see their category (also non-escalated)
export const getAssignedGrievances = async (req, res) => {
  try {
    await runEscalationCheck(); // catch up any grievances that just crossed the 3-day mark

    const { role, category } = req.staff;

    // HOD's "All Complaints" tab excludes escalated ones — those live in the separate tab
    const filter = role === 'HOD'
      ? { escalated: false }
      : { category, escalated: false };

    const grievances = await Grievance.find(filter)
      .populate('student', 'nameAadhar rollNo email department')
      .sort({ createdAt: -1 });

    res.status(200).json(grievances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// get escalated grievances — HOD only
export const getEscalatedGrievances = async (req, res) => {
  try {
    await runEscalationCheck(); // same reasoning — catch up before returning results

    if (req.staff.role !== 'HOD') {
      return res.status(403).json({ message: 'Not authorized to view escalated complaints' });
    }

    const grievances = await Grievance.find({ escalated: true })
      .populate('student', 'nameAadhar rollNo email department')
      .sort({ escalatedAt: -1 });

    res.status(200).json(grievances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// update a grievance's status (staff only)
export const updateGrievanceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = ['Pending', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const grievance = await Grievance.findById(id);

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    const { role, category } = req.staff;

    // once escalated, only HOD can act on it — the original lecturer/warden no longer owns it
    if (grievance.escalated && role !== 'HOD') {
      return res.status(403).json({ message: 'This complaint has been escalated to HOD' });
    }

    // non-escalated: normal category check applies
    if (!grievance.escalated && role !== 'HOD' && grievance.category !== category) {
      return res.status(403).json({ message: 'Not authorized to update this grievance' });
    }

    grievance.status = status;
    await grievance.save();

    res.status(200).json(grievance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// these must exactly match the enums in models/Grievance.js —
// if Gemini returns anything outside these, createGrievance will fail validation later
const VALID_CATEGORIES = ['Academic', 'Hostel', 'Administration', 'Faculty', 'Infrastructure', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

// STUDENT — turn 1-2 rough lines into a full grievance: title, description,
// category, and priority. Student reviews/edits the result and still submits
// normally via createGrievance — this endpoint does NOT save anything to the
// database, it only returns a suggestion.
export const polishGrievance = async (req, res) => {
  try {
    const { roughText } = req.body;

    if (!roughText || !roughText.trim()) {
      return res.status(400).json({ message: 'roughText is required' });
    }

    const prompt = `You are helping a college student turn a rough, informal complaint into a clear, formally-worded grievance for a college complaint system.
 
Rough complaint from the student (may mention what kind of issue it is and how urgent it is):
"${roughText}"
 
Rewrite this as a proper grievance. Respond with ONLY valid JSON, no markdown formatting, no code fences, in exactly this shape:
{
  "title": "a short, clear title (max 10 words)",
  "description": "a formally worded, complete description of the issue, 2-4 sentences, based only on what the student actually said — do not invent new facts or details",
  "category": "must be exactly one of: Academic, Hostel, Administration, Faculty, Infrastructure, Other — pick the closest match based on the complaint",
  "priority": "must be exactly one of: Low, Medium, High — infer from urgency words in the text (e.g. 'urgent', 'immediately', 'for days'); if there's no clear urgency signal, use Medium"
}`;

    const rawResponse = await generateWithGemini(prompt);

    // Gemini sometimes wraps JSON in ```json ... ``` even when asked not to — strip that defensively
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      return res.status(502).json({ message: 'Could not parse AI response, please try again' });
    }

    // guard against Gemini returning a category/priority outside our schema's enum —
    // fall back to safe defaults rather than letting a bad value reach createGrievance later
    const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'Other';
    const priority = VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium';

    res.status(200).json({
      title: parsed.title,
      description: parsed.description,
      category,
      priority,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// STAFF — summarize a long grievance description into a short summary.
// Does NOT modify the grievance in the database — read-only, on-demand.
export const summarizeGrievance = async (req, res) => {
  try {
    const { id } = req.params;

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // same category rule as updateGrievanceStatus — staff can only act on
    // grievances they're actually allowed to see
    const { role, category } = req.staff;
    if (role !== 'HOD' && grievance.category !== category) {
      return res.status(403).json({ message: 'Not authorized to view this grievance' });
    }

    const prompt = `Summarize the following student grievance in 1-2 short sentences for a busy staff member reviewing many complaints. Be factual, do not add opinions or suggestions, just condense what the student wrote.
 
Grievance description:
"${grievance.description}"`;

    const summary = await generateWithGemini(prompt);

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// controllers/grievanceController.js
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    grievance.comments.push({
      author: req.student.email,
      content: content.trim(),
    });
    await grievance.save();

    res.status(201).json(grievance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};