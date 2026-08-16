const crypto = require('crypto');

exports.handler = async (event) => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error('members error: SESSION_SECRET is not set');
    return respond(500, renderDenied('Server misconfigured. Please try again later.'));
  }

  const cookies = parseCookies(event.headers.cookie || '');
  const token = cookies.session;

  const email = token && verifyToken(token, secret);

  if (!email) {
    return {
      statusCode: 302,
      headers: { Location: '/login.html?error=session_expired' },
      body: ''
    };
  }

  return respond(200, renderTools());
};

function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [emailB64, expiryStr, signature] = parts;
  const payload = `${emailB64}.${expiryStr}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null; // bad signature - tampered or forged
  }

  const expiry = parseInt(expiryStr, 10);
  if (!expiry || Date.now() > expiry) {
    return null; // expired
  }

  try {
    return Buffer.from(emailB64, 'base64url').toString('utf8');
  } catch (e) {
    return null;
  }
}

function parseCookies(header) {
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function respond(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body };
}

function pageShell(inner) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Workday Toolkit</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#dee4d5; --paper-card:#f4f2e8; --white-card:#fbfaf5; --ink:#23291f; --ink-soft:#545e4c;
    --forest:#1f3a2e; --stamp-red:#b6392c; --mustard:#c9932f; --line:#b9c0ac;
  }
  *{ box-sizing:border-box; margin:0; padding:0; }
  body{ background:var(--paper); color:var(--ink); font-family:'Inter', sans-serif; line-height:1.55; }
  a{ color:inherit; }
  .wrap{ max-width:980px; margin:0 auto; padding:0 24px; }
  header{ padding:48px 0 32px; border-bottom:1px solid var(--line); }
  .brand{ font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:13px; letter-spacing:.04em; display:flex; align-items:center; gap:10px; margin-bottom:24px; text-decoration:none; color:var(--ink); }
  .brand .mark{ width:10px; height:10px; background:var(--stamp-red); display:inline-block; transform:rotate(45deg); }
  h1{ font-family:'Fraunces', serif; font-weight:600; color:var(--forest); font-size:clamp(24px,4vw,36px); margin-bottom:12px; }
  header p{ color:var(--ink-soft); font-size:15.5px; max-width:560px; }
  section{ padding:44px 0; }
  .cat-label{ font-family:'IBM Plex Mono', monospace; font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-soft); margin:0 0 16px; }
  .grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:36px; }
  @media (max-width:700px){ .grid{ grid-template-columns:1fr; } }
  .tool{ display:flex; align-items:center; justify-content:space-between; gap:14px; background:var(--white-card); border:1px solid var(--line); border-radius:12px; padding:18px 20px; text-decoration:none; color:var(--ink); }
  .tool:hover{ border-color:var(--forest); }
  .tool-name{ font-weight:600; font-size:15px; color:var(--forest); margin-bottom:3px; }
  .tool-desc{ font-size:13px; color:var(--ink-soft); }
  .arrow{ font-family:'IBM Plex Mono', monospace; color:var(--stamp-red); font-size:15px; flex-shrink:0; }
  footer{ border-top:1px solid var(--line); padding:28px 0 60px; margin-top:20px; font-family:'IBM Plex Mono', monospace; font-size:12px; color:var(--ink-soft); }
  footer a{ color:var(--forest); text-decoration:underline; }
  .denied-card{ background:var(--white-card); border:1px solid var(--line); border-radius:16px; padding:44px 38px; max-width:460px; margin:60px auto; text-align:center; }
  .denied-card h1{ font-size:22px; }
  .denied-card p{ color:var(--ink-soft); font-size:14.5px; margin:14px 0 24px; }
  .btn{ display:inline-block; background:var(--stamp-red); color:#f4f2e8; padding:13px 24px; border-radius:8px; text-decoration:none; font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:13.5px; }
</style>
</head>
<body>${inner}</body>
</html>`;
}

function renderDenied(message) {
  return pageShell(`
    <div class="wrap">
      <div class="denied-card">
        <h1>No active membership found</h1>
        <p>${message}</p>
        <a class="btn" href="/login.html">Back to login</a>
      </div>
    </div>
  `);
}

function renderTools() {
  return pageShell(`
<header>
  <div class="wrap">
    <a class="brand" href="/"><span class="mark"></span> AI WORKDAY TOOLKIT</a>
    <h1>Welcome back. Here are your 20 tools.</h1>
    <p>Bookmark this page's login at /login — you'll come back here every time. Pick a tool, paste your info, get your draft.</p>
  </div>
</header>
<section>
  <div class="wrap">

    <p class="cat-label">Email &amp; communication</p>
    <div class="grid">
      <a class="tool" href="https://claude.ai/public/artifacts/d02e7d5d-5a43-4e2c-a7f8-0bc5db39c464" target="_blank" rel="noopener"><div><div class="tool-name">Office Writing Assistant</div><div class="tool-desc">20 built-in tasks — drafts, edits, tone fixes</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/d67694cc-d394-4d5c-9cef-ec0b315a6038" target="_blank" rel="noopener"><div><div class="tool-name">Customer Support Reply Assistant</div><div class="tool-desc">Professional replies to customer messages</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/a5b84aa3-42fd-4c4e-a142-470be4328f92" target="_blank" rel="noopener"><div><div class="tool-name">Email to Action Items</div><div class="tool-desc">Pull out exactly what you need to do</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/a423d1e8-8375-4c24-9474-8154a448b9d9" target="_blank" rel="noopener"><div><div class="tool-name">Difficult Email Assistant</div><div class="tool-desc">Tricky, sensitive, or awkward messages</div></div><span class="arrow">→</span></a>
    </div>

    <p class="cat-label">Spreadsheets &amp; data</p>
    <div class="grid">
      <a class="tool" href="https://claude.ai/public/artifacts/ff4e64f1-c761-4b1c-b774-50338ca42e65" target="_blank" rel="noopener"><div><div class="tool-name">Office Data Cleanup</div><div class="tool-desc">Messy data in, a cleaned table back</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/0b1cf089-7bae-41e7-b765-e9246e4a30ca" target="_blank" rel="noopener"><div><div class="tool-name">Excel Formula Assistant</div><div class="tool-desc">Describe the goal, get the formula explained</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/d66b1573-1d29-4ede-9aa6-b7a0a7fa0bb2" target="_blank" rel="noopener"><div><div class="tool-name">Spreadsheet Analyzer</div><div class="tool-desc">Key patterns explained in plain language</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/eacfde67-99bc-489b-a2dd-de878c03867d" target="_blank" rel="noopener"><div><div class="tool-name">Spreadsheet to Report</div><div class="tool-desc">Raw data turned into a written report</div></div><span class="arrow">→</span></a>
    </div>

    <p class="cat-label">Meetings &amp; reports</p>
    <div class="grid">
      <a class="tool" href="https://claude.ai/public/artifacts/fb31b9a3-3f6d-48e3-92fc-7648e2a2c5cf" target="_blank" rel="noopener"><div><div class="tool-name">Meeting Notes Assistant</div><div class="tool-desc">Rough notes or transcript, made usable</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/48908373-0504-4427-b258-c185c809c634" target="_blank" rel="noopener"><div><div class="tool-name">Meeting Agenda Builder</div><div class="tool-desc">A clean, timed agenda from a description</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/113bca1d-fa92-47a0-8a54-cbfe44671d1e" target="_blank" rel="noopener"><div><div class="tool-name">Project Status Report Generator</div><div class="tool-desc">Rough updates into a polished report</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/f2dfdb61-2e57-42aa-bfb3-74f2e66cb0cc" target="_blank" rel="noopener"><div><div class="tool-name">Document Summarizer</div><div class="tool-desc">Any document, summarized at any length</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/dc7fd75e-cfc0-4550-9e9e-6e48e3f1220b" target="_blank" rel="noopener"><div><div class="tool-name">Document to Checklist</div><div class="tool-desc">A policy or set of instructions, step by step</div></div><span class="arrow">→</span></a>
    </div>

    <p class="cat-label">Planning &amp; operations</p>
    <div class="grid">
      <a class="tool" href="https://claude.ai/public/artifacts/dba0c683-17f8-4d12-af73-e5205cdf8578" target="_blank" rel="noopener"><div><div class="tool-name">Proposal &amp; Quote Assistant</div><div class="tool-desc">Project or deal details, into a polished draft</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/2de3e325-ff22-4c4b-8ba9-5774d0b2cbf1" target="_blank" rel="noopener"><div><div class="tool-name">Research Brief Generator</div><div class="tool-desc">What you know, organized into a clear brief</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/db5513e6-a231-4006-a312-b6aa43e7c1e2" target="_blank" rel="noopener"><div><div class="tool-name">Daily Work Prioritizer</div><div class="tool-desc">A to-do list, sorted by what matters first</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/8f482f7a-fffd-43eb-ab71-e97ec53870e0" target="_blank" rel="noopener"><div><div class="tool-name">Task Planner</div><div class="tool-desc">A goal, broken into concrete, doable steps</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/951ac3b5-ca9a-4e90-a5e5-7d4f0582df2d" target="_blank" rel="noopener"><div><div class="tool-name">SOP Builder</div><div class="tool-desc">A process you already do, written up clearly</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/de495a49-7a5f-4b9c-b2a7-b1c50e18c487" target="_blank" rel="noopener"><div><div class="tool-name">Job Description Assistant</div><div class="tool-desc">Role details, into a ready-to-post listing</div></div><span class="arrow">→</span></a>
      <a class="tool" href="https://claude.ai/public/artifacts/6544c1ca-d430-4c4d-882b-61558a39c323" target="_blank" rel="noopener"><div><div class="tool-name">Performance Review Assistant</div><div class="tool-desc">Notes on an employee, into a structured draft</div></div><span class="arrow">→</span></a>
    </div>

  </div>
</section>
<footer>
  <div class="wrap">Questions or trouble with a tool? Reply to your receipt email and I'll help directly. &nbsp;·&nbsp; <a href="https://workspaceai.net">workspaceai.net</a></div>
</footer>
  `);
