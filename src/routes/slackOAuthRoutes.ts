import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";

import {
  clearPortalCookie,
  parseCookies,
  setPortalCookie,
  signPortalSession,
} from "../portal/auth";

const OAUTH_STATE_COOKIE = "fta_slack_oauth_state";

type SlackTokenResponse = {
  ok: boolean;
  access_token?: string;
  error?: string;
};

type SlackUserInfoResponse = {
  ok: boolean;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  error?: string;
  "https://slack.com/team_id"?: string;
};

function mustEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }

  return value;
}

function setOAuthStateCookie(
  reply: FastifyReply,
  state: string
) {
  const isProd = process.env.NODE_ENV === "production";

  const parts = [
    `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=600",
    ...(isProd ? ["Secure"] : []),
  ];

  reply.header("Set-Cookie", parts.join("; "));
}

function renderLoginError(message: string) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <title>Erro no login</title>
      </head>

      <body
        style="
          margin:0;
          min-height:100vh;
          display:flex;
          justify-content:center;
          align-items:center;
          background:#F3F4F6;
          font-family:Inter,system-ui,-apple-system,sans-serif;
          color:#1F2937;
        "
      >
        <div
          style="
            width:420px;
            background:white;
            padding:36px;
            border-radius:18px;
            box-shadow:0 8px 30px rgba(0,0,0,.08);
          "
        >
          <h1 style="margin:0 0 14px;">
            Não foi possível entrar
          </h1>

          <p
            style="
              color:#6B7280;
              line-height:1.6;
            "
          >
            ${message}
          </p>

          <a
            href="/portal/login"
            style="
              display:block;
              margin-top:24px;
              padding:12px 18px;
              border-radius:12px;
              background:#4A154B;
              color:white;
              text-decoration:none;
              text-align:center;
              font-weight:600;
            "
          >
            Tentar novamente
          </a>
        </div>
      </body>
    </html>
  `;
}

export async function slackOAuthRoutes(
  app: FastifyInstance
) {

  app.get("/auth/slack", async (_request, reply) => {

    const clientId = mustEnv("SLACK_CLIENT_ID");
    const redirectUri = mustEnv("SLACK_REDIRECT_URI");

    const state = crypto
      .randomBytes(32)
      .toString("base64url");

    setOAuthStateCookie(reply, state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: "openid profile email",
      redirect_uri: redirectUri,
      state,
    });

    return reply.redirect(
      `https://slack.com/openid/connect/authorize?${params.toString()}`
    );

  });

  app.get(
    "/auth/slack/callback",
    async (request, reply) => {

      const query = request.query as {
        code?: string;
        state?: string;
        error?: string;
      };

      if (query.error) {
        return reply
          .code(401)
          .type("text/html")
          .send(
            renderLoginError(
              "A autorização pelo Slack foi cancelada ou recusada."
            )
          );
      }

      if (!query.code || !query.state) {
        return reply
          .code(400)
          .type("text/html")
          .send(
            renderLoginError(
              "O Slack não retornou os dados necessários para concluir o login."
            )
          );
      }

      const cookies = parseCookies(
        request.headers.cookie
      );

      const expectedState =
        cookies[OAUTH_STATE_COOKIE];

      if (
        !expectedState ||
        expectedState !== query.state
      ) {
        return reply
          .code(401)
          .type("text/html")
          .send(
            renderLoginError(
              "A tentativa de login expirou ou não pôde ser validada."
            )
          );
      }

      const tokenResponse = await fetch(
        "https://slack.com/api/openid.connect.token",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: query.code,
            client_id: mustEnv("SLACK_CLIENT_ID"),
            client_secret: mustEnv(
              "SLACK_CLIENT_SECRET"
            ),
            redirect_uri: mustEnv(
              "SLACK_REDIRECT_URI"
            ),
          }),
        }
      );

      const tokenData =
        await tokenResponse.json() as SlackTokenResponse;

      if (
        !tokenResponse.ok ||
        !tokenData.ok ||
        !tokenData.access_token
      ) {
        request.log.error(
          {
            slackError: tokenData.error,
          },
          "Slack token exchange failed"
        );

        return reply
          .code(401)
          .type("text/html")
          .send(
            renderLoginError(
              "O Slack não conseguiu concluir a autenticação."
            )
          );
      }

      const userResponse = await fetch(
        "https://slack.com/api/openid.connect.userInfo",
        {
          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,
          },
        }
      );

      const userData =
        await userResponse.json() as SlackUserInfoResponse;

      if (
        !userResponse.ok ||
        !userData.ok ||
        !userData.sub
      ) {
        request.log.error(
          {
            slackError: userData.error,
          },
          "Slack user info failed"
        );

        return reply
          .code(401)
          .type("text/html")
          .send(
            renderLoginError(
              "Não foi possível identificar sua conta do Slack."
            )
          );
      }

      const teamId =
        userData["https://slack.com/team_id"];

      const allowedTeamId = mustEnv(
        "SLACK_ALLOWED_TEAM_ID"
      );

      if (teamId !== allowedTeamId) {
        request.log.warn(
          {
            receivedTeamId: teamId,
          },
          "Portal login rejected for another workspace"
        );

        return reply
          .code(403)
          .type("text/html")
          .send(
            renderLoginError(
              "Sua conta não pertence ao workspace autorizado."
            )
          );
      }

      const token = signPortalSession({
        slackUserId: userData.sub!,
        name: userData.name ?? "Usuário",
        email: userData.email,
        picture: userData.picture,
      });

      setPortalCookie(reply, token);

      return reply.redirect("/portal");

    }
  );

  app.get(
    "/auth/slack/logout",
    async (_request, reply) => {

      clearPortalCookie(reply);

      return reply.redirect("/portal/login");

    }
  );

}