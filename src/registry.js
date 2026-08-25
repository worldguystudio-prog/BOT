/**
 * Component-handler registries.
 *
 * Kept in a standalone module (no system imports) so that systems which
 * register button/select/modal handlers do not create circular imports with
 * the interactionCreate event module.
 */
export const buttonHandlers = {};
export const selectHandlers = {};
export const modalHandlers = {};

export function registerButton(system, fn) {
  buttonHandlers[system] = fn;
}
export function registerSelect(system, fn) {
  selectHandlers[system] = fn;
}
export function registerModal(system, fn) {
  modalHandlers[system] = fn;
}

export default { buttonHandlers, selectHandlers, modalHandlers, registerButton, registerSelect, registerModal };
