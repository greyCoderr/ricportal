let d = "";
process.stdin
  .on("data", (c) => (d += c))
  .on("end", () => {
    try {
      const raw = ((JSON.parse(d).tool_input || {}).file_path || "")
        .split("\\")
        .join("/");
      const f = raw.toLowerCase();
      const isEnv =
        /(^|\/)\.env(\.|$)/.test(f) && !/(^|\/)\.env\.example$/.test(f);
      if (
        isEnv ||
        /(^|\/)uploads\//.test(f) ||
        /(^|\/)private\//.test(f) ||
        /(^|\/)prisma\/migrations\//.test(f)
      ) {
        console.error("Blocked: " + raw + " is protected. Ask the Developer.");
        process.exit(2);
      }
    } catch (e) {}
    process.exit(0);
  });
