
async function check() {
  try {
    const res = await fetch('http://localhost:3005/health'); // or /
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 100));
  } catch (e) {
    console.log('Error:', (e as any).message);
  }
}
check();
