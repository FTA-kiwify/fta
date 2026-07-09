import { portalCss } from "./css";

type PortalLayoutArgs = {
  title: string;
  sidebar: string;
  topbar: string;
  body: string;
};

export function portalLayout(args: PortalLayoutArgs) {
  return `
<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>${args.title}</title>

<style>

body{
  font-family:Arial;
}

</style>

</head>

<body>

<div class="layout">

${args.sidebar}

<div style="flex:1; display:flex; flex-direction:column;">

${args.topbar}

<div class="content">

${args.body}

</div>

</div>

</div>

</body>

</html>
`;
}