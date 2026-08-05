export function log(object: unknown): void {
  console.log(JSON.stringify(object, undefined, 2));
}
