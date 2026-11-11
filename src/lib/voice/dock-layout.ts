export type VoicePanelMode = 'collapsed' | 'compact' | 'maximized';

export interface VoiceDockGeometry {
  isDesktopSplit: boolean;
  panelWidthPx: number;
  pushOffsetPx: number;
}

const LEFT_SIDEBAR_WIDTH_PX = 256;
const MIN_MAIN_WORKSPACE_WIDTH_PX = 440;
const DESKTOP_BREAKPOINT_PX = 1024;

/**
 * Computes responsive Voice Copilot panel dimensions and left-content push offset
 * so the invoice/quote builder & receipt preview always maintain comfortable width.
 */
export function computeVoiceDockGeometry(
  viewportWidth: number,
  panelMode: VoicePanelMode
): VoiceDockGeometry {
  const safeViewport = Math.max(320, Math.round(viewportWidth));
  const isDesktopSplit = safeViewport >= DESKTOP_BREAKPOINT_PX;

  if (panelMode === 'collapsed' || !isDesktopSplit) {
    return {
      isDesktopSplit,
      panelWidthPx: isDesktopSplit ? 340 : safeViewport,
      pushOffsetPx: 0,
    };
  }

  const availableWorkspace = Math.max(320, safeViewport - LEFT_SIDEBAR_WIDTH_PX);
  const maxAllowedDock = Math.max(300, availableWorkspace - MIN_MAIN_WORKSPACE_WIDTH_PX);

  let desiredWidth: number;
  if (panelMode === 'compact') {
    desiredWidth = safeViewport >= 1536 ? 370 : safeViewport >= 1280 ? 340 : 310;
  } else {
    desiredWidth = safeViewport >= 1536 ? 520 : safeViewport >= 1280 ? 460 : 410;
  }

  const clampedWidth = Math.min(desiredWidth, maxAllowedDock);

  return {
    isDesktopSplit: true,
    panelWidthPx: clampedWidth,
    pushOffsetPx: clampedWidth,
  };
}

