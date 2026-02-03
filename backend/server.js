require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple helper: parse months from prompt, default 3
function parseMonths(prompt) {
  const m = prompt && prompt.match(/(\d+)\s*month/);
  if (m) return parseInt(m[1], 10);
  return 3;
}

// Generate a mock study plan split into weeks with simple tasks
function generatePlan(prompt) {
  const months = parseMonths(prompt);
  const weeks = months * 4;
  const plan = [];

  for (let w = 1; w <= weeks; w++) {
    const week = {
      id: `week-${w}`,
      title: `Week ${w}`,
      tasks: [
        { id: `w${w}-1`, text: `Learn/Review core concept ${((w - 1) % 6) + 1}`, done: false },
        { id: `w${w}-2`, text: `Solve 3 coding problems focused on concept ${((w - 1) % 6) + 1}`, done: false },
        { id: `w${w}-3`, text: `Build a tiny project or component applying concept ${((w - 1) % 6) + 1}`, done: false }
      ]
    };
    plan.push(week);
  }

  return {
    meta: { months, weeks, prompt },
    plan,
    tasks: plan.flatMap(w => w.tasks)
  };
}

// Google Gemini Generator
async function aiGeneratePlan(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn('No GEMINI_API_KEY found. Using mock.');
    return generatePlan(prompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are an expert study planner.
    Create a detailed task list based on the user's goal and duration.
    
    CRITICAL: Return ONLY valid JSON. No markdown, no explanations, no code blocks.
    
    Structure:
    {
      "durationDays": NUMBER (total days for the plan),
      "tasks": [
        { "id": "t1", "text": "Specific actionable task", "done": false },
        { "id": "t2", "text": "Another specific task", "done": false }
      ]
    }
    
    Generate enough tasks to fill the duration. For example:
    - 7 days = 14-21 tasks (2-3 per day)
    - 30 days = 30-60 tasks (1-2 per day)
    
    DO NOT use "Week 1", "Week 2" in task text. Make each task standalone and actionable.`;

    const result = await model.generateContent(`${systemPrompt}\n\nUser Goal: ${prompt}`);
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    
    const json = JSON.parse(text);
    if (!json.tasks || !Array.isArray(json.tasks)) throw new Error('Invalid structure');
    return json;
  } catch (e) {
    console.error('Gemini API Error:', e);
    return generatePlan(prompt);
  }
}

async function aiAtomizeTask(taskText) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { subtasks: [] };

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `Break down the given task into 3-5 small, actionable sub-tasks.
    Return ONLY valid JSON.
    Structure: { "subtasks": ["subtask 1", "subtask 2", ...] }`;

    const result = await model.generateContent(`${systemPrompt}\n\nTask: ${taskText}`);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    return JSON.parse(text);
  } catch (e) {
    console.error('Atomize Error:', e);
    return { subtasks: [] };
  }
}

async function aiGetResources(taskText) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { resources: [] };

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `Provide 2-3 high-quality learning resources (documentation, tutorials, or articles) for the given task.
    Return ONLY valid JSON.
    Structure: { "resources": [{ "title": "Resource Name", "url": "Link" }, ...] }`;

    const result = await model.generateContent(`${systemPrompt}\n\nTask: ${taskText}`);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    return JSON.parse(text);
  } catch (e) {
    console.error('Resources Error:', e);
    return { resources: [] };
  }
}

app.post('/api/generate-plan', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  const result = await aiGeneratePlan(prompt);
  res.json(result);
});

app.post('/api/atomize', async (req, res) => {
  const { taskText } = req.body;
  if (!taskText) return res.status(400).json({ error: 'Missing taskText' });
  const result = await aiAtomizeTask(taskText);
  res.json(result);
});

app.post('/api/resources', async (req, res) => {
  const { taskText } = req.body;
  if (!taskText) return res.status(400).json({ error: 'Missing taskText' });
  const result = await aiGetResources(taskText);
  res.json(result);
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
