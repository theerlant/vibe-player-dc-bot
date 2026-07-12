export function titleCheck(input: string): Error | null {
  if (input.length < 3) {
    return Error("TOO SHORT");
  }

  if (input.length > 50) {
    return Error("TOO LONG");
  }

  const regex = /^[a-zA-Z0-9\s-_]{3,50}$/;
  if (!regex.test(input)) {
    return Error("CONTAIN ILLEGAL CHARACTER");
  }

  return null;
}
