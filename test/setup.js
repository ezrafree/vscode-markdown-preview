import { registerHooks } from 'node:module';

const vscodeMock = new URL('./mocks/vscode.js', import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'vscode') return { url: vscodeMock, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
