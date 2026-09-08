const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envLine = fs.readFileSync(path.join('c:/Users/SSD/Documents/stratmeridian.com', '.env.local'), 'utf8')
  .split('\n')
  .find((l) => l.startsWith('MONGODB_URI'));
const uri = envLine.split('=').slice(1).join('=').trim();

const rawHtml = `<div class="smsvc">
  <div class="smsvc-eyebrow">Individual Tax Filing</div>
  <h2 class="smsvc-heading">Everything included in your <em>US Federal Return</em></h2>
  <p class="smsvc-lead">We prepare and file your federal Form 1040 with the IRS, handling W-2, 1099, and standard/itemized deduction scenarios so your return is accurate, compliant, and filed on time.</p>

  <div class="smsvc-grid">
    <div class="smsvc-card">
      <div class="smsvc-card-num">01</div>
      <h3>Document Review</h3>
      <p>Upload your W-2s, 1099s, and prior-year return. Our specialists review everything before we begin.</p>
    </div>
    <div class="smsvc-card">
      <div class="smsvc-card-num">02</div>
      <h3>Return Preparation</h3>
      <p>We prepare your Form 1040, applying every deduction and credit you qualify for.</p>
    </div>
    <div class="smsvc-card">
      <div class="smsvc-card-num">03</div>
      <h3>Quality Check</h3>
      <p>A second reviewer verifies the return against current IRS rules before it goes anywhere.</p>
    </div>
    <div class="smsvc-card">
      <div class="smsvc-card-num">04</div>
      <h3>E-File &amp; Confirmation</h3>
      <p>We e-file with the IRS and send you the acceptance confirmation for your records.</p>
    </div>
  </div>

  <div class="smsvc-split">
    <div>
      <h3 class="smsvc-subheading">Documents you'll need</h3>
      <ul class="smsvc-list">
        <li>W-2 forms from all employers</li>
        <li>1099 forms (NEC, INT, DIV, etc.)</li>
        <li>Prior-year tax return, if available</li>
        <li>Social Security numbers for you and dependents</li>
        <li>Records of deductible expenses</li>
      </ul>
    </div>
    <div>
      <h3 class="smsvc-subheading">Frequently asked questions</h3>
      <div class="smsvc-faq">
        <div class="smsvc-faq-item">
          <p class="smsvc-faq-q">How long does filing take?</p>
          <p class="smsvc-faq-a">Most federal returns are prepared and filed within 3-5 business days of receiving your documents.</p>
        </div>
        <div class="smsvc-faq-item">
          <p class="smsvc-faq-q">What if I have income from multiple states?</p>
          <p class="smsvc-faq-a">This filing covers your federal return. State returns can be added separately - contact our team for a quote.</p>
        </div>
        <div class="smsvc-faq-item">
          <p class="smsvc-faq-q">Is my information secure?</p>
          <p class="smsvc-faq-a">Yes. Documents are transmitted and stored securely, and only accessed by your assigned preparer.</p>
        </div>
      </div>
    </div>
  </div>
</div>`;

const customCss = `.smsvc{max-width:var(--container);margin:0 auto}
.smsvc-eyebrow{font-size:12px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;color:var(--gold);margin-bottom:14px}
.smsvc-heading{font-family:var(--serif);font-weight:300;font-size:clamp(28px,3.4vw,42px);color:var(--text-primary);line-height:1.15;margin:0 0 20px}
.smsvc-heading em{font-style:normal;font-weight:500;color:var(--gold)}
.smsvc-lead{font-size:17px;line-height:1.75;color:var(--text-secondary);max-width:720px;margin:0 0 56px}
.smsvc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(16,25,24,.1);margin-bottom:64px}
.smsvc-card{background:var(--surface,#fff);padding:32px 26px}
.smsvc-card-num{font-family:var(--serif);font-size:13px;color:var(--gold);letter-spacing:.08em;margin-bottom:14px}
.smsvc-card h3{font-family:var(--serif);font-weight:400;font-size:19px;color:var(--text-primary);margin:0 0 10px}
.smsvc-card p{font-size:14px;line-height:1.6;color:var(--text-secondary);margin:0}
.smsvc-split{display:grid;grid-template-columns:1fr 1fr;gap:60px}
.smsvc-subheading{font-family:var(--serif);font-weight:400;font-size:22px;color:var(--text-primary);margin:0 0 22px}
.smsvc-list{list-style:none;margin:0;padding:0}
.smsvc-list li{position:relative;padding-left:20px;font-size:14.5px;color:var(--text-primary);line-height:1.9;border-top:1px solid rgba(16,25,24,.1);padding-top:14px;padding-bottom:14px}
.smsvc-list li:first-child{border-top:none}
.smsvc-list li::before{content:"";position:absolute;left:0;top:23px;width:8px;height:1px;background:var(--gold)}
.smsvc-faq-item{border-top:1px solid rgba(16,25,24,.1);padding:16px 0}
.smsvc-faq-q{font-weight:600;font-size:14.5px;color:var(--text-primary);margin:0 0 8px}
.smsvc-faq-a{font-size:13.5px;color:var(--text-secondary);line-height:1.7;margin:0}
@media(max-width:900px){.smsvc-grid{grid-template-columns:repeat(2,1fr)}.smsvc-split{grid-template-columns:1fr;gap:40px}}
@media(max-width:560px){.smsvc-grid{grid-template-columns:1fr}}`;

mongoose.connect(uri).then(async () => {
  const id = new mongoose.Types.ObjectId('6a9eb1e9766ac6c9d4e3ea2b');
  const before = await mongoose.connection.db.collection('services').findOne({ _id: id });
  console.log('BEFORE htmlContent:', before.htmlContent);
  console.log('BEFORE rawHtml:', before.rawHtml);
  console.log('BEFORE customCss:', JSON.stringify(before.customCss));

  const result = await mongoose.connection.db.collection('services').updateOne(
    { _id: id },
    { $set: { htmlContent: rawHtml, rawHtml, customCss, updatedAt: new Date() } }
  );
  console.log('Update result:', JSON.stringify(result));

  const after = await mongoose.connection.db.collection('services').findOne({ _id: id });
  console.log('AFTER rawHtml length:', after.rawHtml.length);
  console.log('AFTER customCss length:', after.customCss.length);
  process.exit(0);
}).catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
