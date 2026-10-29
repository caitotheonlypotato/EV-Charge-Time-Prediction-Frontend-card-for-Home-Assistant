# EV Charge Time Prediction Card for Home Assistant

A custom Lovelace card that plots your EV's state of charge against time, with a projected line to the target or 100%, the predicted finish time, sunrise and sunset markers, day and night shading, and an info bar of live readouts.

The card is designed for people who have access to state of charge (SOC) information and/or a charge rate entity, but no entity that gives an end time. It works out the finish time itself from your battery size and charge rate.

<img width="531" height="450" alt="image" src="https://github.com/user-attachments/assets/22587cfa-af65-4535-8a69-50734e05dfa3" />
<br>
<img width="447" height="437" alt="image" src="https://github.com/user-attachments/assets/4b7412d1-71fd-4e9a-9924-dfa1f37782b5" />
<br>
<img width="452" height="108" alt="image" src="https://github.com/user-attachments/assets/116a8ceb-8c1a-4d8e-89d7-0c35b235240b" />
<br>
<img width="448" height="397" alt="image" src="https://github.com/user-attachments/assets/29ccd3ce-9e73-4fc9-a02c-d2cab2dea11e" />
<br>
<img width="444" height="241" alt="image" src="https://github.com/user-attachments/assets/1c03b422-a5bd-403f-af17-aed9c3b40c80" />
<br>
<img width="438" height="453" alt="image" src="https://github.com/user-attachments/assets/31b95fa7-88f5-4d5c-9b92-84eaea7117fd" />
<br>
<img width="439" height="258" alt="image" src="https://github.com/user-attachments/assets/3b8588cb-b9c9-451a-b851-0fc4ad500be7" />
<br>
<img width="446" height="431" alt="image" src="https://github.com/user-attachments/assets/c07710d7-a9f5-4cb0-819e-e498e0f319e1" />
<br>
<img width="446" height="293" alt="image" src="https://github.com/user-attachments/assets/3db44aff-431b-400a-8b7f-e9b00df79237" />
<br>
<img width="448" height="345" alt="image" src="https://github.com/user-attachments/assets/9ebcaab2-e00a-41bb-8112-3e1838e8d8cf" />
<br>
<img width="454" height="416" alt="image" src="https://github.com/user-attachments/assets/b26e07f1-6d3f-4250-abc1-514488bedb4c" />







---

## Features

- SOC history plotted from your state of charge sensor, with a live "Now" marker
- Projected charge line to the target and to 100%, using the charge rate and battery size
- Predicted finish times shown on the graph and in the info bar
- Optional BMS overhead for a 101% target, so the projection reaches the target after the 100% time
- Sunrise and sunset markers, with day and night shading across the whole window
- Info bar with SOC, rate, target time and 100% time, in an order you can see in the bar
- Highly configurable appearance, with almost every element adjustable on its own:
  - **Fonts:** a font choice for the whole card, plus size, colour, opacity and bold for the title, info bar, axis, legend and each label
  - **Colours:** separate colours for the actual, projected and target lines, the 100%, Now, sunrise and sunset markers, the grid, day and night shading, and the intersection dots
  - **Label styles:** each label (target time, target pill, 100%, Now, sunrise, sunset) has its own text colour, background colour, no-background option, opacity and bold
  - **Lines:** width, dash style and opacity for each line
  - **Backgrounds:** a solid colour, a transparent solid, or a picture with fit, scale, position and opacity controls
  - **Info bar:** six readout styles (plain, pills, filled, boxed, stacked, ticker), four alignments (left, centre, right, spread), its own background, and a choice of which items appear and in what order
  - **Title, axis and legend:** alignment, size, colour, opacity, bold, and background for the title and legend
- Two charge rate sensors with a choice of which is used first
- Sunrise and sunset markers, with day and night shading across the whole window
- Optional BMS overhead for a 101% target, so the projection reaches the target after the 100% time
- Height and height factor, time format, and window and history settings
- Visual editor with collapsible sections, grouped so every setting has a clear home, plus full YAML support

---

## Requirements

- A working Home Assistant installation with access to `/config/www/`
- A modern browser (Chrome, Edge, Firefox, Safari, or the Home Assistant companion apps)
- A numeric sensor for state of charge (SOC)
- A charge rate sensor in kW or W. The card reads the rate as positive while charging

---

## Installation (manual)

1. **Download the card.** Save `ev-charge-time-prediction.js` from this repository.

2. **Copy the file** to your Home Assistant `www` folder. The location depends on your setup:

   ```
   /config/www/ev-charge-time-prediction.js
   ```

   or, if you use a community subfolder:

   ```
   /config/www/community/ev-charge-time-prediction/ev-charge-time-prediction.js
   ```

   If the `www` folder doesn't exist, create it. Files placed there are served at `/local/`, so the first option is served at `/local/ev-charge-time-prediction.js` and the second at `/local/community/ev-charge-time-prediction/ev-charge-time-prediction.js`. Use whichever path matches where the file actually is.

3. **Add the resource.**
   - Go to **Settings → Dashboards**.
   - Open the three-dot menu (top right) and choose **Resources**.
   - Select **Add resource** and enter:
     - **URL:** `/local/ev-charge-time-prediction.js` (or `/local/community/ev-charge-time-prediction/ev-charge-time-prediction.js` if you used the community folder)
     - **Resource type:** `JavaScript module`
   - Select **Create**.

4. **Clear the browser cache** or do a hard refresh (Ctrl+F5, or Cmd+Shift+R on macOS) so the new file loads.

5. **Add the card.** Edit a dashboard, select **Add card**, search for **EV Charge**, or use the YAML editor with the example below.

### Updating

Replace the file in the same folder you installed it to, then clear your browser cache. You don't need to change the resource entry unless you've moved the file or changed its name, in which case update the resource URL to match.

If the card still shows the old version, add a version number to the resource URL, for example `?v=2`, so the browser fetches the new file.

---

## Quick start

```yaml
type: custom:ev-charge-time-prediction
soc_entity: sensor.ev_battery_level
target_entity: input_number.ev_charge_target
rate_first_entity: sensor.ev_charge_rate
battery_kwh: 60
```

---

## Full example

```yaml
type: custom:ev-charge-time-prediction
title: Zoe Charge Time Prediction
soc_entity: sensor.zoe_soc
target_entity: input_number.zoe_charge_target
rate_first_entity: sensor.zoe_charge_rate
rate_second_entity: sensor.zoe_combined_charge_rate
rate_preference: first
sun_entity: sun.sun
battery_kwh: 52
bms_overhead_min: 30
window_before: 30
window_after: 60
history_hours: 1
history_refresh_min: 5
height_factor: 1.2
time_24h: true
readout_style: pills
readout_align: left
show_night: true
background_type: solid
background_color: '#1c1c1c'
```

---

## Configuration reference

### Entities

| Option | Type | Default | Description |
|---|---|---|---|
| `soc_entity` | string | **required** | Sensor or input number for state of charge, in percent |
| `target_entity` | string | `''` | Charge target, in percent. Ignored while `target_use_fixed` is on. Values above 100 mean the target includes the BMS overhead |
| `target_use_fixed` | boolean | `false` | Use a fixed target percentage instead of `target_entity`. Useful if you don't have a target SOC entity |
| `target_percent` | number | `80` | Fixed charge target, from 0 to 101. Set to 101 to calculate the full-charge time with BMS balancing overhead. Only used while `target_use_fixed` is on |
| `rate_first_entity` | string | `''` | Charge rate sensor, in kW or W |
| `rate_second_entity` | string | `''` | Second charge rate sensor, used when the first is not available |
| `rate_preference` | string | `first` | `first` uses the first sensor, then the second. `second` reverses this |
| `sun_entity` | string | `sun.sun` | Sun entity used for sunrise, sunset and day and night shading |

### Battery and prediction

| Option | Type | Default | Description |
|---|---|---|---|
| `battery_kwh` | number | `60` | Usable battery size in kWh (20 to 250). Used to convert the charge rate into percent per hour |
| `bms_overhead_min` | number | `30` | Extra minutes the battery management system takes to reach 100% when the target is set above 100 |

### Window and history

| Option | Type | Default | Description |
|---|---|---|---|
| `window_before` | number | `30` | Minutes of the graph shown before now |
| `window_after` | number | `60` | Minutes shown after the predicted 100% time |
| `history_hours` | number | `1` | Hours of SOC history loaded (0.25 to 24) |
| `history_refresh_min` | number | `5` | How often the full history is reloaded, in minutes (1 to 60) |

The graph's time range is dynamic. It runs from before now to the predicted finish time, plus `window_after`.

### Layout

| Option | Type | Default | Description |
|---|---|---|---|
| `height` | number | `360` | Graph height in pixels (120 to 1000) |
| `height_factor` | number | `1` | Multiplies the height. `1.2` is 20% taller. Range 0.5 to 2 |
| `time_24h` | boolean | `true` | Show times in 24-hour format |

### Title

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | `EV Charge Time Prediction` | Card title |
| `title_show` | boolean | `true` | Show the title |
| `title_align` | string | `center` | `left`, `center` or `right` |
| `title_size` | number | `18` | Title size in pixels |
| `title_color` | colour | `#ffffff` | Title text colour |
| `title_opacity` | number | `1` | Title opacity (0 to 1) |
| `title_bold` | boolean | `false` | Bold title |
| `title_bg` | colour | `#000000` | Title background |
| `title_bg_none` | boolean | `true` | No title background |

### Info bar (readouts)

| Option | Type | Default | Description |
|---|---|---|---|
| `readouts_show` | boolean | `true` | Show the info bar |
| `readout_style` | string | `pills` | `plain`, `pills`, `filled`, `boxed`, `stacked` or `ticker` |
| `readout_align` | string | `left` | `left`, `center`, `right` or `spread` |
| `readout_size` | number | `13` | Text size in pixels |
| `readout_color` | colour | `#ffffff` | Text colour |
| `readout_opacity` | number | `1` | Opacity (0 to 1) |
| `readout_bold` | boolean | `false` | Bold values |
| `readout_bar_bg` | colour | `#2a2a2a` | Background behind the info bar |
| `readout_bar_bg_none` | boolean | `true` | No background behind the info bar |

Items appear in the info bar when their data is available. Target and 100% are ordered by time. Target comes first, except when the target is above 100%, where 100% comes first because the BMS overhead pushes the target time later.

### Background

| Option | Type | Default | Description |
|---|---|---|---|
| `background_type` | string | blank | `solid` or `picture`. Blank uses picture mode if an image path is set, otherwise solid |
| `background_color` | colour | `#1c1c1c` | Solid background colour |
| `background_transparent` | boolean | `false` | Solid mode only: makes the card background see-through |
| `background_image` | path | `''` | Image path, for example `/local/ev-background.jpg` |
| `background_image_opacity` | number | `0.7` | Image opacity |
| `background_fit` | string | `cover` | How the image fills the card |
| `background_scale` | number | `1` | Image scale |
| `background_repeat` | string | `no-repeat` | Image repeat setting |
| `background_top` / `background_left` | number | `50` | Image position in percent |

### Text and axis

| Option | Type | Default | Description |
|---|---|---|---|
| `font_family` | string | `''` | Font for the card. Blank uses the Home Assistant font |
| `axis_size` | number | `12` | Axis text size |
| `axis_color` | colour | `#cccccc` | Axis text colour |
| `axis_opacity` | number | `1` | Axis opacity |
| `axis_bold` | boolean | `false` | Bold axis text |
| `grid_color` | colour | `#ffffff` | Grid line colour |
| `grid_opacity` | number | `0.2` | Grid line opacity |

### Legend

| Option | Type | Default | Description |
|---|---|---|---|
| `legend_show` | boolean | `true` | Show the legend |
| `legend_size` | number | `12` | Legend text size |
| `legend_color` | colour | `#cccccc` | Legend text colour |
| `legend_opacity` | number | `1` | Legend opacity |
| `legend_bold` | boolean | `false` | Bold legend text |
| `legend_bg` | colour | `#000000` | Legend background |
| `legend_bg_none` | boolean | `true` | No legend background |

### Lines

Each line has a colour, width (`*_width`), dash style (`*_dash`) and opacity (`*_opacity`).

| Line | Colour option | Default colour |
|---|---|---|
| Actual (SOC history) | `actual_color` | `#2ec4b6` |
| Projected | `projected_color` | `#e71d36` |
| Target | `target_color` | `#ffb703` |

### Markers and labels

| Option | Type | Default | Description |
|---|---|---|---|
| `target_pill_show` | boolean | `true` | Show the horizontal Target value pill |
| `target_marker_opacity` | number | `1` | Opacity of the target line marker |
| `show_full` | boolean | `true` | Show the 100% marker |
| `full_color` | colour | `#2ec4b6` | 100% marker colour |
| `full_marker_opacity` | number | `1` | 100% marker opacity |
| `show_now` | boolean | `true` | Show the Now marker |
| `now_color` | colour | `#1e90ff` | Now marker colour |
| `now_marker_opacity` | number | `1` | Now marker opacity |
| `show_sun_markers` | boolean | `true` | Show sunrise and sunset markers |
| `sunrise_color` | colour | `#ffb703` | Sunrise marker colour |
| `sunset_color` | colour | `#e71d36` | Sunset marker colour |
| `sun_marker_opacity` | number | `1` | Sun marker opacity |
| `label_max_shift` | number | `40` | How far labels can move sideways to avoid overlapping |

### Day and night shading

| Option | Type | Default | Description |
|---|---|---|---|
| `show_daylight` | boolean | `true` | Shade daylight periods |
| `sun_color` | colour | `#ffb703` | Daylight colour |
| `sun_opacity` | number | `0.3` | Daylight opacity |
| `show_night` | boolean | `false` | Shade night periods |
| `night_color` | colour | `#0b1220` | Night colour |
| `night_opacity` | number | `1` | Night opacity |

Shading covers every day and night period in the window, so it works for charge times longer than 24 hours.

### Label styles

Each label element has its own settings, using the same pattern:

| Setting | Description |
|---|---|
| `<element>_size` | Text size in pixels |
| `<element>_text` | Text colour |
| `<element>_bg` | Background colour |
| `<element>_bg_none` | Turn off the background |
| `<element>_opacity` | Opacity |
| `<element>_bold` | Bold text |

The elements are:

- `target_v`: Target time label on the target line (vertical)
- `target_h`: Target value pill (horizontal)
- `full`: 100% label (vertical)
- `now`: Now label (vertical)
- `sunrise`: Sunrise label (vertical)
- `sunset`: Sunset label (vertical)

Vertical and horizontal show how the label sits on the graph. In the editor, every element is in the **Text and label styles** grid.

---

## Using the visual editor

Open the card's editor and expand the sections:

- **Entities:** SOC, target (an entity, or a fixed percentage with a tick box), charge rate sensors, sun
- **Battery and prediction:** battery size, BMS overhead
- **Window and history:** time shown before and after, history settings
- **Layout:** height, height factor, time format
- **Title, Background, Text:** title, background, font and readout style
- **Text and label styles:** one row per element, with columns for size, text, background, no background, opacity and bold
- **Lines, Markers and labels, Sun shading:** line colours and widths, marker options, day and night shading

Each section shows a summary of its current settings when collapsed.

---

## Troubleshooting

- **Card doesn't appear in the picker:** Check that the resource is added as a JavaScript module at the path you copied the file to, then clear your browser cache.
- **Old version still loads:** Add a version number to the resource URL, such as `?v=2`, and do a hard refresh.
- **"Custom element doesn't exist: ev-charge-time-prediction":** The file didn't load. Check the resource URL and the file's location, then look for an error on the file's request in the browser developer tools.
- **Target shows 100% instead of 101%:** The displayed target is capped at 100. The projection and the target time still use the value from the sensor.
- **Target and 100% times are in the wrong order:** Check that `target_entity` is the value you expect. Targets above 100 put the 100% time first.
- **Charge line is missing:** Check that `rate_first_entity` reports a positive charge rate (kW or W), and that `battery_kwh` is set to your battery's usable size.
- **Height factor has no effect:** Check that the card is not inside a fixed-size layout element, such as a picture elements card. Card sizing depends on the parent layout.

---

## Contributing

Issues and pull requests are welcome. Please describe the change you're proposing and include the Home Assistant version and your configuration (with any sensitive entity names removed) when reporting a bug.

---

## Disclaimer

**Please read before installing.**

- **Back up first.** Before installing or updating this card, back up your Home Assistant configuration, dashboards and any automations that use the entities shown on the card. Editing or replacing files in `/config` can break your setup.
- **Use at your own risk.** This card is provided "as is", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
- **Estimates only.** The charge time and finish time are predictions based on the rate and battery size you provide. Charging speed, battery temperature and vehicle settings all affect the real time. Don't rely on the card for trip planning or any other safety-critical decision.
- **No liability.** The authors and contributors accept no responsibility for damage, data loss, or any other loss arising from the use of this card, whether caused by bugs, misconfiguration, sensor faults, network or service problems, or anything else.
- **Not affiliated.** This project is not affiliated with, endorsed by, or supported by Home Assistant, Nabu Casa, or any vehicle or charger manufacturer. Product names are used for identification only.
- **Third-party integrations.** Sensors depend on their own integrations and hardware. Check that they work reliably before relying on them in a dashboard.

---

## Licence

Add your chosen licence here (for example MIT) and include a `LICENSE` file in the repository.
