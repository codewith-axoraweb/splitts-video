/**
 * Subtitle generator utilities.
 * Shifts and filters segments for a given clip time range.
 */

function filterAndShiftSegments(segments, clipStart, clipEnd) {
  const result = [];
  for (const seg of segments) {
    if (seg.end <= clipStart || seg.start >= clipEnd) continue;

    let start = Math.max(seg.start, clipStart) - clipStart;
    let end = Math.min(seg.end, clipEnd) - clipStart;

    if (start < 0) start = 0;
    if (end <= start) continue;

    result.push({
      start,
      end,
      text: seg.text,
    });
  }
  return result;
}

module.exports = {
  filterAndShiftSegments,
};
