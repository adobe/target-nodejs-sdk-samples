<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MCID (Visitor API) Integration Sample</title>
  <script src="VisitorAPI.js"></script>
  <script>
    Visitor.getInstance("${organizationId}", {serverState: ${visitorState}});
  </script>
</head>
<body>
  <pre>${content}</pre>
</body>
</html>
