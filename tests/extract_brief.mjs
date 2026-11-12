import fs from 'fs';
import readline from 'readline';

const transcriptPath = process.env.USERPROFILE + '/.gemini/antigravity/brain/c930dc0e-7375-4a2b-a656-ea3fb2ce0dc4/.system_generated/logs/transcript_full.jsonl';
const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

for await (const line of rl) {
  if (line.includes('"step_index":5016')) {
    const data = JSON.parse(line);
    const content = data.content;
    fs.writeFileSync('tests/brief_all_prompts.txt', content);
    console.log('Saved brief_all_prompts.txt successfully! Length:', content.length);
    break;
  }
}

