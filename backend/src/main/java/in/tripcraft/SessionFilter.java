package in.tripcraft;

import static in.tripcraft.Json.*;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.net.URI;
import java.security.MessageDigest;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SessionFilter extends OncePerRequestFilter {
  private final StateStore store;
  private final boolean secure;
  private final String origin;

  public SessionFilter(
      StateStore store,
      @Value("${tripcraft.cookie-secure}") boolean secure,
      @Value("${tripcraft.allowed-origin}") String origin) {
    this.store = store;
    this.secure = secure;
    this.origin = origin;
  }

  String sign(String id) {
    try {
      var mac = Mac.getInstance("HmacSHA256");
      mac.init(
          new SecretKeySpec(
              store.secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
      return HexFormat.of()
          .formatHex(mac.doFinal(id.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Request-Id", id());
    if (!req.getRequestURI().startsWith("/api/")) {
      chain.doFilter(req, res);
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    String suppliedOrigin = req.getHeader("Origin");
    boolean write = !Set.of("GET", "HEAD", "OPTIONS").contains(req.getMethod());
    if (write && suppliedOrigin != null) {
      try {
        if (!URI.create(suppliedOrigin).getAuthority().equals(req.getHeader("Host"))
            && !suppliedOrigin.equals(origin)) {
          error(res, 403, "Cross-origin write rejected.");
          return;
        }
      } catch (Exception e) {
        error(res, 403, "Invalid origin.");
        return;
      }
    }
    String owner = "";
    if (req.getCookies() != null)
      for (Cookie c : req.getCookies())
        if (c.getName().equals("tc_session")) {
          String[] parts = c.getValue().split("\\.");
          if (parts.length == 2
              && parts[0].matches("[a-zA-Z0-9-]{1,80}")
              && MessageDigest.isEqual(sign(parts[0]).getBytes(), parts[1].getBytes()))
            owner = parts[0];
        }
    if (owner.isEmpty()) {
      owner = id();
      res.addHeader(
          "Set-Cookie",
          "tc_session="
              + owner
              + "."
              + sign(owner)
              + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000"
              + (secure ? "; Secure" : ""));
    }
    req.setAttribute("owner", owner);
    if (write) {
      byte[] body = req.getInputStream().readNBytes(65537);
      if (body.length > 65536) {
        error(res, 413, "Request too large.");
        return;
      }
      var wrapped =
          new HttpServletRequestWrapper(req) {
            @Override
            public ServletInputStream getInputStream() {
              var input = new ByteArrayInputStream(body);
              return new ServletInputStream() {
                public int read() {
                  return input.read();
                }

                public boolean isFinished() {
                  return input.available() == 0;
                }

                public boolean isReady() {
                  return true;
                }

                public void setReadListener(ReadListener listener) {
                  throw new UnsupportedOperationException();
                }
              };
            }

            @Override
            public BufferedReader getReader() {
              return new BufferedReader(
                  new InputStreamReader(getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
            }
          };
      chain.doFilter(wrapped, res);
    } else chain.doFilter(req, res);
  }

  private void error(HttpServletResponse r, int status, String text) throws IOException {
    r.setStatus(status);
    r.setContentType("application/json");
    r.getWriter().write(obj("detail", text).toString());
  }
}
