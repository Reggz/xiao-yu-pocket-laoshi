import readline from "readline";
import { normalizeInput } from "./normalize";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(): void {
  rl.question("> ", (line) => {
    if (line.trim().toLowerCase() === ":q") {
      rl.close();
      return;
    }
    const result = normalizeInput(line);
    console.log(JSON.stringify(result, null, 2));
    prompt();
  });
}

console.log("Input test CLI. Type :q to quit.");
prompt();
