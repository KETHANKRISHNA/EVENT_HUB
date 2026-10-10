const http = require('http');

async function test() {
  const data = {
    title: 'Automated Test Event',
    description: 'A test event description with at least 10 chars',
    category: 'Music',
    city: 'Hyderabad',
    venueName: 'Uppal Stadium',
    address: 'Uppal',
    startsAt: new Date(Date.now() + 86400000),
    endsAt: new Date(Date.now() + 2 * 86400000),
    bannerUrl: '',
    hasSeating: false
  };

  // 1. Get CSRF token
  let res = await fetch('http://localhost:3000/api/auth/csrf');
  let csrfData = await res.json();
  const csrfToken = csrfData.csrfToken;
  let cookies = res.headers.get('set-cookie');

  // 2. Login as organizer
  let loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies
    },
    body: new URLSearchParams({
      csrfToken: csrfToken,
      email: 'organizer1@eventhub.com',
      password: 'Password@123',
      redirect: 'false'
    })
  });
  
  let loginCookies = loginRes.headers.get('set-cookie');
  console.log("Login Cookies:", loginCookies);

  // Extract authjs.session-token
  let sessionCookie = '';
  if (loginCookies) {
    const parts = loginCookies.split(',');
    for (const part of parts) {
      if (part.includes('authjs.session-token')) {
        sessionCookie = part.split(';')[0].trim();
      }
    }
  }

  if (!sessionCookie) {
    console.error("Failed to get session cookie!");
    // we can try falling back to the API route bypassing auth to just ensure DB insert works
  }

  // 3. Create event using Next.js action API route we built earlier
  const allCookies = [cookies, sessionCookie].filter(Boolean).join('; ');
  let apiRes = await fetch('http://localhost:3000/api/test-create-action', {
    headers: {
      'Cookie': allCookies
    }
  });
  let apiData = await apiRes.json();
  console.log("API Result:", apiData);
}

test().catch(console.error);
