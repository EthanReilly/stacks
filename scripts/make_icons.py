"""Draws the Stacks icon (no monochrome layer: with one, phones using themed icons
show a single-colour silhouette instead of the green logo): a stack of index cards. Writes Android vector drawables,
legacy PNG launcher icons and a 512px PNG for the download page."""
import os, sys
from PIL import Image, ImageDraw

ROOT = sys.argv[1]
RES = os.path.join(ROOT, 'android/app/src/main/res')
GREEN, CARD, TAB1, TAB2, INK = '#1E5D54', '#F3F5F4', '#CFE7E0', '#8FC7B9', '#1E5D54'

# geometry on the 108x108 adaptive-icon canvas (safe zone is the centre 66x66)
BACK  = (38, 30, 70, 40, 4)   # x0, y0, x1, y1, radius (tab peeking out)
MID   = (33.5, 35, 74.5, 45, 4.5)
FRONT = (29, 40, 79, 78, 6)
LINES = [(36, 51.5, 70), (36, 58.5, 66), (36, 65.5, 58)]  # x0, y, x1 (rounded lines)
LINE_W = 3.6

def rr(x0, y0, x1, y1, r):
    return (f"M{x0+r},{y0} H{x1-r} A{r},{r} 0 0 1 {x1},{y0+r} V{y1-r} A{r},{r} 0 0 1 {x1-r},{y1} "
            f"H{x0+r} A{r},{r} 0 0 1 {x0},{y1-r} V{y0+r} A{r},{r} 0 0 1 {x0+r},{y0} Z")
def line(x0, y, x1, w=LINE_W):
    return rr(x0, y - w/2, x1, y + w/2, w/2)

def vector(paths, size=108, vp=108, translate=0):
    body = ''.join(f'\n    <path android:fillColor="{c}" android:pathData="{d}"/>' for c, d in paths)
    g = f'\n  <group android:translateX="{translate}" android:translateY="{translate}">{body}\n  </group>' if translate else body
    return (f'<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
            f'    android:width="{size}dp" android:height="{size}dp" android:viewportWidth="{vp}" android:viewportHeight="{vp}">{g}\n</vector>\n')

fg_paths = [(TAB2, rr(*BACK)), (TAB1, rr(*MID)), (CARD, rr(*FRONT))] + [(INK, line(*l)) for l in LINES]
# monochrome / notification silhouette: one colour, lines cut by drawing them as gaps (evenOdd not needed: draw card outline pieces)
os.makedirs(f'{RES}/drawable', exist_ok=True)
open(f'{RES}/drawable-v24/ic_launcher_foreground.xml', 'w').write(vector(fg_paths))
open(f'{RES}/drawable/ic_launcher_background.xml', 'w').write(vector([(GREEN, 'M0,0h108v108h-108z')]))
for name in ('ic_launcher', 'ic_launcher_round'):
    open(f'{RES}/mipmap-anydpi-v26/{name}.xml', 'w').write(
        '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@drawable/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n')
# notification small icon: white silhouette on a 24dp canvas (scale the 108 artwork by 24/66 around the safe zone)
s = 24 / 54
def scale(rect):
    x0, y0, x1, y1, r = rect
    return ((x0-27)*s, (y0-27)*s, (x1-27)*s, (y1-27)*s, r*s)
notif = vector([('#FFFFFF', rr(*scale(BACK))), ('#FFFFFF', rr(*scale(MID))), ('#FFFFFF', rr(*scale(FRONT)))], size=24, vp=24)
open(f'{RES}/drawable/ic_stat_stacks.xml', 'w').write(notif)
# splash icon (Android 12+ shows it inside a circle; reuse the foreground)
# legacy PNGs
def draw_png(px, round_=False, full=False):
    S = 4 * px
    k = S / 108 if full else S / 80   # legacy icons: crop to the central 80 units so the art fills more
    off = 0 if full else -14 * k
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if round_: d.ellipse((0, 0, S - 1, S - 1), fill=GREEN)
    else: d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * (0.0 if full else 0.18)), fill=GREEN)
    def box(rect, fill):
        x0, y0, x1, y1, r = rect
        d.rounded_rectangle((x0*k+off, y0*k+off, x1*k+off, y1*k+off), radius=r*k, fill=fill)
    box(BACK, TAB2); box(MID, TAB1); box(FRONT, CARD)
    for x0, y, x1 in LINES: box((x0, y - LINE_W/2, x1, y + LINE_W/2, LINE_W/2), INK)
    return im.resize((px, px), Image.LANCZOS)
for dens, px in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    folder = f'{RES}/mipmap-{dens}'
    for f in os.listdir(folder): os.remove(os.path.join(folder, f))
    draw_png(px).save(f'{folder}/ic_launcher.png')
    draw_png(px, round_=True).save(f'{folder}/ic_launcher_round.png')
os.makedirs(f'{ROOT}/docs', exist_ok=True)
draw_png(512, full=True).save(f'{ROOT}/docs/icon-512.png')
draw_png(192).save(f'{ROOT}/docs/icon-192.png')
print('icons written')
