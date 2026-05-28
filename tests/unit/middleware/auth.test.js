const {
  requireAuth,
  requireOng,
  requireAdmin,
  redirectIfLoggedIn
} = require('../../../app/middleware/auth');
const {
  createMockReq,
  createMockRes,
  createMockNext
} = require('../../helpers/httpMocks');

describe('middleware de autenticação', () => {
  test('requireAuth redireciona usuários anônimos para o login', () => {
    const req = createMockReq({ session: {} });
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAuth permite usuários autenticados', () => {
    const req = createMockReq({ session: { user: { id: 1 } } });
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('requireAdmin rejeita usuários que não são admin', () => {
    const req = createMockReq({ session: { user: { id: 11, type: 'user' } } });
    const res = createMockRes();
    const next = createMockNext();

    requireAdmin(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAdmin permite o acesso de administradores', () => {
    const req = createMockReq({ session: { user: { id: 1, type: 'admin' } } });
    const res = createMockRes();
    const next = createMockNext();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('requireAdmin rejeita usuarios do tipo ong', () => {
    const req = createMockReq({ session: { user: { id: 1, type: 'ong' } } });
    const res = createMockRes();
    const next = createMockNext();

    requireAdmin(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/ongs/admin/dashboard');
    expect(next).not.toHaveBeenCalled();
  });

  test('requireOng permite o acesso de usuarios do tipo ong', () => {
    const req = createMockReq({ session: { user: { id: 1, type: 'ong' } } });
    const res = createMockRes();
    const next = createMockNext();

    requireOng(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('requireOng redireciona administradores para o painel de admin', () => {
    const req = createMockReq({ session: { user: { id: 1, type: 'admin' } } });
    const res = createMockRes();
    const next = createMockNext();

    requireOng(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin');
    expect(next).not.toHaveBeenCalled();
  });

  test('redirectIfLoggedIn envia usuários administradores para o painel admin', () => {
    const req = createMockReq({ session: { user: { id: 1, type: 'admin' } } });
    const res = createMockRes();
    const next = createMockNext();

    redirectIfLoggedIn(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin');
    expect(next).not.toHaveBeenCalled();
  });

  test('redirectIfLoggedIn envia usuarios do tipo ong para o painel da ONG', () => {
    const req = createMockReq({ session: { user: { id: 1, type: 'ong' } } });
    const res = createMockRes();
    const next = createMockNext();

    redirectIfLoggedIn(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/ongs/admin/dashboard');
    expect(next).not.toHaveBeenCalled();
  });

  test('redirectIfLoggedIn permite que usuários anônimos continuem', () => {
    const req = createMockReq({ session: {} });
    const res = createMockRes();
    const next = createMockNext();

    redirectIfLoggedIn(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
