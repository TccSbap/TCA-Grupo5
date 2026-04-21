const {
  requireAuth,
  requireAdmin,
  redirectIfLoggedIn
} = require('../../../middleware/auth');
const {
  createMockReq,
  createMockRes,
  createMockNext
} = require('../../helpers/httpMocks');

describe('middleware/auth', () => {
  test('requireAuth redirects anonymous users to login', () => {
    const req = createMockReq({ session: {} });
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAuth allows authenticated users', () => {
    const req = createMockReq({ session: { user: { id: 1 } } });
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('requireAdmin rejects non-admin users', () => {
    const req = createMockReq({ session: { user: { id: 11, type: 'user' } } });
    const res = createMockRes();
    const next = createMockNext();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('403', {
      title: 'Acesso Negado',
      message: 'Você precisa ser uma ONG para acessar esta área.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAdmin allows admins to continue', () => {
    const req = createMockReq({ session: { user: { id: 1, type: 'admin' } } });
    const res = createMockRes();
    const next = createMockNext();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('redirectIfLoggedIn sends logged users to the dashboard', () => {
    const req = createMockReq({ session: { user: { id: 1 } } });
    const res = createMockRes();
    const next = createMockNext();

    redirectIfLoggedIn(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    expect(next).not.toHaveBeenCalled();
  });

  test('redirectIfLoggedIn lets anonymous users continue', () => {
    const req = createMockReq({ session: {} });
    const res = createMockRes();
    const next = createMockNext();

    redirectIfLoggedIn(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
