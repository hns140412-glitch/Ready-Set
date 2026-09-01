exports.handler = async function () {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    },
    body: JSON.stringify({ now: Date.now() })
  };
};
