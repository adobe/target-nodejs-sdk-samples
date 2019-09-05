<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Target SPA Demo</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="icon" href="https://wwwimages2.adobe.com/favicon.ico" type="image/x-icon">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
  <link rel="stylesheet" type="text/css" charset="UTF-8" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick.min.css"/>
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick-theme.min.css"/>
  <link rel="stylesheet" href="assets/css/base.min.css">
  <link rel="stylesheet" href="assets/css/app.css">
  <script src="VisitorAPI.js"></script>
  <script>
    Visitor.getInstance("${organizationId}", {serverState: ${visitorState}});
  </script>
  <script>
    window.targetGlobalSettings = {
      overrideMboxEdgeServer: true,
      clientCode: "${clientCode}",
      imsOrgId: "${organizationId}",
      serverDomain: "${serverDomain}",
      serverState: ${serverState} || {}
    }
  </script>
  <script src="at.js"></script>
</head>
<body>
  <div id="app"></div>
  <script src="assets/js/app.js"></script>
  <script src="AppMeasurement.js"></script>
  <script>var s_code=s.t();if(s_code)document.write(s_code);</script>
</body>
</html>
