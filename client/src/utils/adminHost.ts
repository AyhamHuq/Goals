export function isAdminHostname(hostname: string): boolean {
  return hostname.startsWith('admin.') || hostname.startsWith('admin-');
}
