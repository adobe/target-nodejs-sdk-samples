<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Advanced at.js Integration with ServerState Sample</title>
  <script src="VisitorAPI.js"></script>
  <script>
    Visitor.getInstance("${organizationId}", {serverState: ${visitorState}});
  </script>
  <script>
    window.targetGlobalSettings = {
      overrideMboxEdgeServer: true,
      serverState: ${serverState}
    };
  </script>
  <script src="at.js"></script>
</head>
<body>
  <pre>${content}</pre>
  <script src="AppMeasurement.js"></script>
  <script>var s_code=s.t();if(s_code)document.write(s_code);</script>
</body>
</html>
