# Homepage timeline v1

The original animated “Weeks → Days → Hours → Minutes” homepage timeline was retired from the live layout in favor of the editorial homepage sequence.

It remains recoverable in two places:

- The inert `<template id="archived-homepage-timeline-v1">` in `index.html` preserves a ready-to-restore copy of the timeline markup.
- Git commit `fd35b23ba5269bba5c6da5c0cbd63687a0e1808f` preserves the exact production version, including its original markup, CSS, and animation script.

The timeline CSS and guarded JavaScript remain in `index.html`. Because the live page has no `.turn-strip` outside the inert template, the animation exits without doing work.

To restore it, copy the template’s section back into the live document immediately after the header spacer. For the exact historical version, restore only the timeline section from commit `fd35b23` rather than reverting the whole homepage.
