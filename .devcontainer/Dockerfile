FROM node:22

WORKDIR /workspace

# install claude code cli tool
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/root/.local/bin:${PATH}"
# NOTICE: this does not setup any account, we have installed claude code cli if someone prefers the cli over the chat interface; in that case they can run `claude` to setup their account at the first devcontainer run

# Install VNC server, a minimal window manager, and x11vnc for password management
RUN apt-get update && apt-get install -y --no-install-recommends \
    tigervnc-standalone-server \
    tigervnc-tools \
    openbox \
    x11vnc \
    && rm -rf /var/lib/apt/lists/*

# Pre-create VNC password and xstartup script
RUN mkdir -p /root/.vnc \
    && echo "password" | tigervncpasswd -f > /root/.vnc/passwd && chmod 600 /root/.vnc/passwd \
    && printf '#!/bin/sh\nexec openbox\n' > /root/.vnc/xstartup && chmod +x /root/.vnc/xstartup

# Install Playwright system-level dependencies for Chromium
RUN npx playwright@latest install-deps chromium

# Install Playwright Chromium browser (baked in image)
RUN npx playwright@latest install chromium

CMD ["sleep", "infinity"]