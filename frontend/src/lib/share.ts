/** Native share sheet where available, otherwise copy the current page link. */
export async function shareLink(title: string, toast: (t: { text: string; icon?: string }) => void) {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    toast({ icon: 'share', text: 'Link copied to clipboard' })
  } catch {
    // The user closed the share sheet.
  }
}
