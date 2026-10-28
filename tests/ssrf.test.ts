import assert from "node:assert/strict";
import test from "node:test";
import { isPublicAddress, isSafeTarget, resolveSafeTarget } from "../lib/server/ssrf";

test("reject private, mapped, reserved and encoded addresses", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "100.64.0.1", "169.254.169.254", "192.0.0.1", "198.18.0.1", "203.0.113.1", "224.0.0.1", "::", "::1", "::ffff:8.8.8.8", "fe80::1", "fc00::1", "2001:db8::1", "2002:808:808::1"]) assert.equal(isPublicAddress(address), false, address);
  for (const target of ["http://2130706433", "http://0x7f000001", "http://[::ffff:127.0.0.1]", "ftp://example.com", "http://user:password@example.com", "https://example.com:3000", "http://localhost."]) assert.equal(isSafeTarget(target).safe, false, target);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});
test("DNS rejects any unsafe answer and keeps approved public destination", async () => {
  await assert.rejects(resolveSafeTarget("https://example.com", async () => [{ address: "8.8.8.8", family: 4 }, { address: "::1", family: 6 }]), /restricted/);
  const result = await resolveSafeTarget("https://example.com", async () => [{ address: "8.8.8.8", family: 4 }]);
  assert.equal(result.domain, "example.com");
  assert.equal(result.address.address, "8.8.8.8");
});
