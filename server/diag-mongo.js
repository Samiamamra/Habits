// تشخيص آمن لرابط MongoDB — لا يطبع كلمة المرور أبدًا.
// تشغيل محلي (bash):        MONGODB_URI='mongodb+srv://...' node server/diag-mongo.js
// تشغيل محلي (PowerShell):  $env:MONGODB_URI='mongodb+srv://...'; node server/diag-mongo.js
// على Render: اجعل Start Command مؤقتًا  node server/diag-mongo.js  ثم أعده إلى node server/server.js
// DIAG_NO_CONNECT=1 يفحص الرابط فقط دون محاولة اتصال.

const clean = raw => raw.trim().replace(/^["'`]+|["'`]+$/g, '').trim();

function describe(raw) {
  const L = [], warn = m => L.push('⚠ ' + m);
  if (!raw) { warn('MONGODB_URI غير مضبوط (فارغ).'); return L; }

  L.push('طول الرابط الكلي: ' + raw.length);
  if (raw !== raw.trim()) warn('الرابط يبدأ أو ينتهي بمسافة/سطر جديد — انسخه من جديد دون مسافات.');
  if (/^["'`]|["'`]$/.test(raw.trim())) warn('الرابط محاط بعلامات اقتباس — في Render الصق القيمة بدون " أو \'.');

  const s = clean(raw);
  const m = s.match(/^(mongodb(?:\+srv)?):\/\/(.*)$/);
  if (!m) { warn('الرابط لا يبدأ بـ mongodb:// أو mongodb+srv://'); return L; }
  const scheme = m[1], rest = m[2];
  L.push('البروتوكول: ' + scheme);

  const q = rest.indexOf('?');
  const head = q === -1 ? rest : rest.slice(0, q), opts = q === -1 ? '' : rest.slice(q + 1);
  const at = head.lastIndexOf('@');
  if (at === -1) { warn('لا يوجد "@" — الرابط بلا اسم مستخدم/كلمة مرور.'); return L; }
  const creds = head.slice(0, at), hostPath = head.slice(at + 1);
  const c = creds.indexOf(':');
  if (c === -1) { warn('لا يوجد ":" بين اسم المستخدم وكلمة المرور.'); return L; }
  const user = creds.slice(0, c), pass = creds.slice(c + 1);

  L.push('اسم المستخدم (كما قرأه السكربت): ' + JSON.stringify(user));
  L.push('طول كلمة المرور: ' + pass.length);
  if (user !== user.trim()) warn('اسم المستخدم فيه مسافات زائدة.');
  if (pass !== pass.trim()) warn('كلمة المرور فيها مسافة/سطر جديد في أولها أو آخرها.');
  if (/[<>]/.test(pass) || pass === '<password>') warn('كلمة المرور تحوي < أو > — على الأرجح تركت علامتي <password> حول كلمة المرور. احذفهما.');
  if (/[:\/?#\[\]@]/.test(pass) || /%(?![0-9a-fA-F]{2})/.test(pass)) warn('كلمة المرور فيها رموز خاصة غير مرمّزة (: / ? # [ ] @ %) — استعمل حروفًا وأرقامًا فقط أو رمّزها.');
  if (!/^[\w.-]+$/.test(user)) warn('اسم المستخدم فيه رموز غير معتادة.');

  const slash = hostPath.indexOf('/');
  const host = slash === -1 ? hostPath : hostPath.slice(0, slash), dbName = slash === -1 ? '' : hostPath.slice(slash + 1);
  L.push('المضيف: ' + host);
  L.push('اسم قاعدة البيانات في الرابط: ' + (dbName || '(لا شيء)'));
  L.push('خيارات الرابط: ' + (opts || '(لا شيء)'));
  if (!/mongodb\.net$/.test(host.split(':')[0])) warn('المضيف ليس نطاق mongodb.net الخاص بـ Atlas.');
  if (scheme === 'mongodb' && !/authSource=/.test(opts)) warn('رابط mongodb:// (غير SRV) بدون authSource — مستخدمو Atlas يوجدون في قاعدة admin، أضف ?authSource=admin');
  return L;
}

async function main() {
  console.log('Node ' + process.version);
  const raw = process.env.MONGODB_URI;
  describe(raw).forEach(l => console.log('DIAG:', l));
  if (!raw || process.env.DIAG_NO_CONNECT) return;

  let MongoClient;
  try { ({ MongoClient } = require('mongodb')); console.log('DIAG: mongodb driver ' + require('mongodb/package.json').version); }
  catch (e) { console.log('DIAG: تعذّر تحميل حزمة mongodb — نفّذ npm install أولًا'); return; }

  const attempt = async (label, opts) => {
    const client = new MongoClient(clean(raw), { serverSelectionTimeoutMS: 8000, ...opts });
    try {
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      console.log('DIAG: ✅ ' + label + ' — نجح الاتصال والمصادقة');
      return true;
    } catch (e) {
      console.log('DIAG: ❌ ' + label + ' — ' + (e.codeName || e.code || e.name) + ': ' + e.message);
      return false;
    } finally { await client.close().catch(() => {}); }
  };

  if (await attempt('الاتصال بالرابط كما هو', {})) return;
  if (await attempt('الاتصال مع authSource=admin صريحًا', { authSource: 'admin' })) {
    console.log('DIAG: الحل: أضف ?authSource=admin إلى نهاية MONGODB_URI.');
    return;
  }
  console.log('DIAG: فشل الاثنان. إن كانت الرسالة "bad auth" فاسم المستخدم أو كلمة المرور لا يطابقان مستخدمًا موجودًا في نفس مشروع Atlas الذي فيه هذا الـ cluster.');
}

module.exports = { describe };
if (require.main === module) main().catch(e => { console.error('DIAG: خطأ غير متوقع:', e.message); process.exit(1); });
