import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51THVGkAmEkKGLsAUAM7iQi07dyyZJeAuhpRrHXwTHxXMesZF4vbHMmG4XFyHPANfIbms0HAhBefjvbCr5x9ElB6C00LZZazhLD', {
  apiVersion: '2023-10-16' as any,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { cycle, email, userId } = req.body;
      const amount = cycle === 'yearly' ? 4000 : 399; // 40.00 EUR vs 3.99 EUR
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: { 
          cycle: cycle || 'monthly',
          email: email || 'unknown',
          userId: userId || 'unknown'
        },
        receipt_email: email
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    const { email, userId } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
      // 1. Check Checkout Sessions (for Direct Links)
      const sessions = await stripe.checkout.sessions.list({
        limit: 20,
      });

      const successfulSession = sessions.data.find(session => 
        (session.customer_details?.email?.toLowerCase() === email.toLowerCase() || 
         session.metadata?.userId === userId) && 
        session.payment_status === 'paid'
      );

      if (successfulSession) {
        return res.json({ success: true, method: 'checkout_session' });
      }

      // 2. Check Payment Intents (for Embedded Form)
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 20,
      });
      
      const successfulPI = paymentIntents.data.find(pi => 
        (pi.metadata?.email?.toLowerCase() === email.toLowerCase() || 
         pi.metadata?.userId === userId ||
         pi.receipt_email?.toLowerCase() === email.toLowerCase()) && 
        pi.status === 'succeeded'
      );

      if (successfulPI) {
        return res.json({ success: true, method: 'payment_intent' });
      }

      res.json({ success: false, message: "No successful payment found for this account." });
    } catch (e: any) {
      console.error('Verification error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Strava OAuth Callback
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'STRAVA_AUTH_ERROR', error: '${error}' }, '*');
                window.close();
              }
            </script>
            <p>Authentication failed. You can close this window.</p>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokens.message || "Failed to exchange tokens");
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'STRAVA_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Strava token exchange error:", err);
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'STRAVA_AUTH_ERROR', error: '${err.message}' }, '*');
                window.close();
              }
            </script>
            <p>Authentication failed. You can close this window.</p>
          </body>
        </html>
      `);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
