/**
 * Confirming the e-mail before the sign-up, with the code of the login by
 * code. The back-end (Cunha) still has to:
 * - send the code to e-mails without account too (today: 400 "Email não
 *   cadastrado.");
 * - answer usuario/loginCodigo with { tokenCadastro } for those e-mails;
 * - require that tokenCadastro in POST usuario.
 *
 * false: e-mails without account get a simulated code (DEMO_SIGNUP_CODE) and
 * nothing goes to the API; e-mails with account work for real.
 * true: everything goes to the API and tokenCadastro is sent in the sign-up.
 */
export const EMAIL_CONFIRMATION_LIVE = false;

/** The simulated code shown in the demonstration */
export const DEMO_SIGNUP_CODE = "123456";
