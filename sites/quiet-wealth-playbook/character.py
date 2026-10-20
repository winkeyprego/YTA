"""Complete teacup illustration displayed from the preserved source atlas."""
from html import escape as e

def cell(x,y,w,atlas_x,atlas_y,cls='',cell_height=640):
    return f'<svg x="{x}" y="{y}" width="{w}" height="{w*cell_height/640:g}" viewBox="0 0 640 {cell_height}" overflow="hidden" aria-hidden="true" class="{cls}"><image href="assets/alicia-puppet-v5.webp" x="{-atlas_x}" y="{-atlas_y}" width="1280" height="1280"/></svg>'

def render_tea():
    return '<svg class="alicia-tea" data-life viewBox="0 -30 640 670" width="640" height="670" role="img" aria-label="Alicia holding a teacup and saucer, ready for a calm conversation."><image href="assets/alicia-puppet-v5.webp" x="-640" y="-640" width="1280" height="1280"/></svg>'
