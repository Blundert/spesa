FROM node:22

WORKDIR /workspace

# install claude code cli tool
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/root/.local/bin:${PATH}"
# NOTICE: this does not setup any account, we have installed claude code cli if someone prefers the cli over the chat interface; in that case they can run `claude` to setup their account at the first devcontainer run

CMD ["sleep", "infinity"]