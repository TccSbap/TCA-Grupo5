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

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('403', {
      title: 'Acesso Negado',
      message: 'Você precisa ser uma ONG para acessar esta área.'
    });
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

  test('redirectIfLoggedIn envia usuários logados para o dashboard', () => {
    const req = createMockReq({ session: { user: { id: 1, type: 'admin' } } });
    const res = createMockRes();
    const next = createMockNext();

    redirectIfLoggedIn(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard_admin');
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
