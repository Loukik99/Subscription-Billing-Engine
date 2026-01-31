const { Client } = require('pg');

const passwords = ['', 'password', 'admin', 'root', '123456'];
const user = 'postgres';

async function test() {
  for (const pass of passwords) {
    const cs = `postgresql://${user}:${pass}@localhost:5432/postgres`;
    console.log(`Trying password: '${pass}'`);
    const client = new Client({ connectionString: cs });
    try {
      await client.connect();
      console.log(`SUCCESS! Password is: '${pass}'`);
      await client.end();
      return;
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }
}

test();
