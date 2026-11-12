(function () {
  var config = window.AXISCRIPT_WAITLIST || {};
  var form = document.getElementById("waitlist-form");
  if (!form) return;

  var emailInput = document.getElementById("waitlist-email");
  var nameInput = document.getElementById("waitlist-name");
  var honeypot = document.getElementById("waitlist-company");
  var statusEl = document.getElementById("waitlist-status");
  var fields = document.getElementById("waitlist-fields");
  var successEl = document.getElementById("waitlist-success");
  var button = document.getElementById("waitlist-submit");
  var allowedDevices = { Phone: true, Tablet: true, Laptop: true };

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (button.disabled) return;

    var email = (emailInput.value || "").trim().toLowerCase();
    var name = (nameInput.value || "").trim();
    var workInput = form.querySelector('input[name="work_type"]:checked');
    var work = workInput ? workInput.value : "";
    var devices = selectedDevices();

    statusEl.textContent = "";
    emailInput.removeAttribute("aria-invalid");

    if (!isValidEmail(email)) {
      emailInput.setAttribute("aria-invalid", "true");
      statusEl.textContent = "Enter a valid email address.";
      emailInput.focus();
      return;
    }

    // Bots that fill the hidden field get the success state and no request.
    if ((honeypot.value || "").trim()) {
      showSuccess();
      return;
    }

    var key = String(config.publishableKey || "").trim();
    var url = String(config.supabaseUrl || "").replace(/\/$/, "");
    if (!url || !key || key.indexOf("PASTE_") === 0) {
      statusEl.textContent = "Waitlist signup isn’t open on this copy of the site yet. Email support@axiscript.com and we’ll add you.";
      return;
    }
    if (jwtRole(key) === "service_role") {
      statusEl.textContent = "That key is a secret key. Paste the publishable key into assets/waitlist-config.js.";
      return;
    }

    var payload = { email: email, source: "website" };
    if (name) payload.name = name;
    if (work) payload.work_type = work;
    if (devices.length) payload.report_devices = devices;

    button.disabled = true;
    button.textContent = "Joining…";

    postWaitlist(url, key, payload).then(function (res) {
      if (res.ok) {
        showSuccess();
        return;
      }
      return readError(res).then(function (body) {
        if (isDuplicate(res, body)) {
          statusEl.textContent = "You’re already on the list";
          return;
        }
        // Column or grant may not be in place yet. Retry without the new field.
        if (payload.report_devices && isMissingDeviceColumn(res, body)) {
          var retryPayload = {
            email: payload.email,
            source: payload.source
          };
          if (payload.name) retryPayload.name = payload.name;
          if (payload.work_type) retryPayload.work_type = payload.work_type;
          return postWaitlist(url, key, retryPayload).then(function (retryRes) {
            if (retryRes.ok) {
              showSuccess();
              return;
            }
            return readError(retryRes).then(function (retryBody) {
              if (isDuplicate(retryRes, retryBody)) {
                statusEl.textContent = "You’re already on the list";
                return;
              }
              statusEl.textContent = "Something went wrong. Try again, or email support@axiscript.com.";
            });
          });
        }
        statusEl.textContent = "Something went wrong. Try again, or email support@axiscript.com.";
      });
    }).catch(function () {
      statusEl.textContent = "Something went wrong. Try again, or email support@axiscript.com.";
    }).then(function () {
      if (!successEl.hidden) return;
      button.disabled = false;
      button.textContent = "Save my spot";
    });
  });

  function showSuccess() {
    fields.hidden = true;
    successEl.hidden = false;
    successEl.focus();
  }

  function selectedDevices() {
    var boxes = form.querySelectorAll('input[name="report_devices"]:checked');
    var devices = [];
    for (var i = 0; i < boxes.length; i++) {
      var value = boxes[i].value;
      if (allowedDevices[value] && devices.indexOf(value) === -1) {
        devices.push(value);
      }
    }
    return devices;
  }

  // return=minimal so PostgREST does not try to read the new row back.
  // anon has insert only, and a returning select would fail.
  function postWaitlist(url, key, payload) {
    return fetch(url + "/rest/v1/waitlist", {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });
  }

  function readError(res) {
    return res.json().catch(function () { return {}; });
  }

  function isDuplicate(res, body) {
    return res.status === 409 || (body && body.code === "23505");
  }

  function isMissingDeviceColumn(res, body) {
    var code = body && body.code ? String(body.code) : "";
    if (code === "PGRST204" || code === "42703") return true;
    var text = [
      body && body.message,
      body && body.hint,
      body && body.details
    ].filter(Boolean).join(" ");
    return res.status >= 400 && res.status < 500 && /report_devices/i.test(text);
  }

  function isValidEmail(email) {
    if (!email || email.length > 320) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function jwtRole(key) {
    var parts = key.split(".");
    if (parts.length !== 3) return "";
    try {
      var b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var payload = JSON.parse(atob(b64));
      return payload && payload.role ? String(payload.role) : "";
    } catch (e) {
      return "";
    }
  }
})();
