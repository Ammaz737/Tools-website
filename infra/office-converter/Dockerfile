FROM gotenberg/gotenberg:8.38.0@sha256:c36cdd730893e3941d27a196ff8b68675e473642d067ec7ee3668b9adaa37b75
USER root
COPY configure-calc.py /usr/local/lib/workshop/configure-calc.py
RUN python3 /usr/local/lib/workshop/configure-calc.py
USER 1001:1001
