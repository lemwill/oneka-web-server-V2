module.exports = (router) => {
  router.get('/ping', (req, res) => {
    return res.sendStatus(200);
  });

  return router;
};
