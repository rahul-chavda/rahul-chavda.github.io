export interface IPTVChannel {
  name: string;
  url: string;
  channelNumber: number;
  group?: string;
  tvgId?: string;
}

export function parseM3uContent(m3uContent: string): IPTVChannel[] {

  const lines = m3uContent.trim().split(/\r?\n/);
  const channels: IPTVChannel[] = [];

  // Check if the first line is the M3U header
  if (!lines[0].startsWith('#EXTM3U')) {
    console.warn('Invalid M3U format: Missing #EXTM3U header');
    return [];
  }

  let currentChannel: Partial<IPTVChannel> | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Parse EXTINF line which contains channel info
    if (line.startsWith('#EXTINF:')) {
      currentChannel = {};

      // Extract duration and name
      const matches = line.match(/#EXTINF:(-?\d+)(?:\s+(.+?))?(?:,(.+))?$/);

      if (matches && matches[3]) {
        currentChannel.name = matches[3].trim();
      }

      // Extract attributes (key="value" or key='value' pairs)
      const attributesMatches = line.matchAll(/([a-zA-Z0-9-_]+)=["']([^"']+)["']/g);
      for (const match of attributesMatches) {
        const [, key, value] = match;

        if (key === 'tvg-id') {
          currentChannel.tvgId = value;
        } else if (key === 'group-title') {
          currentChannel.group = value;
        }
      }
    } else if (line.startsWith('#EXTGRP:')) {
      if (currentChannel) {
        currentChannel.group = line.substring(8).trim();
      }
    } else if (!line.startsWith('#') && currentChannel) {
      currentChannel.url = line;

      if (currentChannel.url && currentChannel.name) {
        currentChannel.channelNumber = channels.length + 1;
        channels.push(currentChannel as IPTVChannel);
      }

      // Reset current channel
      currentChannel = null;
    }
  }

  return channels;
}
