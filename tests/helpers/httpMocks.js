const createMockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  session: {},
  ...overrides
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

module.exports = {
  createMockReq,
  createMockRes,
  createMockNext
};
