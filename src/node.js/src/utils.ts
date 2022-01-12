import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

export const question = (query = ""): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};
