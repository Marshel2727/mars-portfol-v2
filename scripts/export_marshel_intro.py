"""Prepare web assets without saving or modifying the source .blend file.

Run with Blender: blender --background --disable-autoexec SOURCE.blend
  --python scripts/export_marshel_intro.py -- --output front_end/public
The original 24 fps, 192-frame animation is exported as one GLB scene clip.
"""

import argparse
import hashlib
import json
import struct
import sys
from pathlib import Path

import bpy


args = argparse.ArgumentParser()
args.add_argument("--output", type=Path, required=True)
args.add_argument("--references", type=Path)
args.add_argument("--reuse-references", action="store_true")
opts = args.parse_args(sys.argv[sys.argv.index("--") + 1:])
output = opts.output.resolve()
opts.references = opts.references or output.parent.parent / "docker-backups" / "intro-qa"
brand = output / "brand"
models = output / "models"
for directory in (brand, models, opts.references):
    directory.mkdir(parents=True, exist_ok=True)

source = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
scene = bpy.context.scene
source_camera = scene.camera
scene.render.resolution_x = scene.render.resolution_y = 640
scene.render.resolution_percentage = 100
scene.render.image_settings.media_type = "IMAGE"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = False

# Retain three reference renders from the unmodified source materials.
for frame in (1, 96, 192):
    if opts.reuse_references and (opts.references / f"blender-{frame:03}.png").exists():
        continue
    scene.frame_set(frame)
    scene.render.filepath = str(opts.references / f"blender-{frame:03}.png")
    bpy.ops.render.render(write_still=True)

# Use the assembled emblem, without small lettering, for navigation and icons.
scene.frame_set(192)
hidden_for_icon = []
for obj in scene.objects:
    if obj.name.startswith(("Text |", "Typography |", "Studio | matte")):
        hidden_for_icon.append((obj, obj.hide_render))
        obj.hide_render = True
# Center and enlarge the emblem on its badge when the typography is removed.
icon_rig = bpy.data.objects.new("EXPORT ONLY | icon emblem", None)
scene.collection.objects.link(icon_rig)
reparented = []
emblem_prefixes = ("Monogram |", "Circuit |", "Orbit |", "MARS |")
for obj in list(scene.objects):
    if obj.name.startswith(emblem_prefixes) and not (obj.parent and obj.parent.name.startswith(emblem_prefixes)):
        reparented.append((obj, obj.parent, obj.matrix_world.copy()))
        world = obj.matrix_world.copy()
        obj.parent = icon_rig
        obj.matrix_world = world
icon_rig.location.y = -1.2
icon_rig.scale = (1.35, 1.35, 1.35)
original_ortho = source_camera.data.ortho_scale
source_camera.data.ortho_scale = 11.6
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 512
scene.render.filepath = str(brand / "marshel-logo-v1.png")
bpy.ops.render.render(write_still=True)
for obj, parent, world in reparented:
    obj.parent = parent
    obj.matrix_world = world
bpy.data.objects.remove(icon_rig, do_unlink=True)
scene.frame_set(192)
source_camera.data.ortho_scale = original_ortho
scene.render.film_transparent = False
for obj, hidden in hidden_for_icon:
    obj.hide_render = hidden

visible = [obj for obj in scene.objects if obj.visible_get() and not obj.hide_render]
# Convert curves in place, preserving objects, parenting, actions and transforms.
for obj in visible:
    if obj.type in {"CURVE", "FONT"}:
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target="MESH")

# Bake procedural surfaces onto portable texture maps. A planar swatch is
# sufficient for the repeated brushed metal; Mars uses its original spherical UV.
scene.render.engine = "CYCLES"
scene.cycles.samples = 8
scene.cycles.device = "CPU"
scene.render.bake.margin = 8
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
textures = []


def bake_surface(material_name, sphere=None):
    material = bpy.data.materials[material_name]
    principled = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    values = {name: principled.inputs[name].default_value for name in ("Metallic", "Roughness")}
    base = tuple(principled.inputs["Base Color"].default_value)
    if sphere is None:
        bpy.ops.mesh.primitive_plane_add(size=2)
        obj = bpy.context.object
        obj.name = "EXPORT ONLY | material swatch"
        obj.data.materials.append(material)
    else:
        obj = sphere
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    baked = {}
    for kind, bake_type in (("color", "DIFFUSE"), ("normal", "NORMAL")):
        image = bpy.data.images.new(f"{material_name} | baked {kind}", width=512, height=512)
        image.colorspace_settings.name = "Non-Color" if kind == "normal" else "sRGB"
        target = material.node_tree.nodes.new("ShaderNodeTexImage")
        target.image = image
        material.node_tree.nodes.active = target
        bpy.ops.object.bake(type=bake_type)
        image.filepath_raw = str(opts.references / (material_name.split(" |")[0].replace(" ", "-") + f"-{kind}.png"))
        image.file_format = "PNG"
        image.save()
        image.pack()
        baked[kind] = image
        textures.append(image.name)
    nodes = material.node_tree.nodes
    nodes.clear()
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Metallic"].default_value = values["Metallic"]
    shader.inputs["Roughness"].default_value = values["Roughness"]
    shader.inputs["Base Color"].default_value = base
    color = nodes.new("ShaderNodeTexImage")
    color.image = baked["color"]
    normal_tex = nodes.new("ShaderNodeTexImage")
    normal_tex.image = baked["normal"]
    normal = nodes.new("ShaderNodeNormalMap")
    out = nodes.new("ShaderNodeOutputMaterial")
    links = material.node_tree.links
    links.new(color.outputs["Color"], shader.inputs["Base Color"])
    links.new(normal_tex.outputs["Color"], normal.inputs["Color"])
    links.new(normal.outputs["Normal"], shader.inputs["Normal"])
    links.new(shader.outputs["BSDF"], out.inputs["Surface"])
    if sphere is None:
        bpy.data.objects.remove(obj, do_unlink=True)


for material_name in ("Brushed silver | face", "Brushed copper | face", "Typography | legible warm copper"):
    bake_surface(material_name)
bake_surface("Mars | procedural basalt, rust and craters", bpy.data.objects["MARS | 3D rotating planet"])

procedural_names = {"Brushed silver | face", "Brushed copper | face", "Typography | legible warm copper"}
for obj in visible:
    if obj.type == "MESH" and any(mat and mat.name in procedural_names for mat in obj.data.materials):
        if not obj.data.uv_layers:
            uv = obj.data.uv_layers.new(name="UVMap")
            xs = [v.co.x for v in obj.data.vertices]
            ys = [v.co.y for v in obj.data.vertices]
            width = max(max(xs) - min(xs), 0.001)
            height = max(max(ys) - min(ys), 0.001)
            for loop in obj.data.loops:
                co = obj.data.vertices[loop.vertex_index].co
                uv.data[loop.index].uv = ((co.x - min(xs)) / width, (co.y - min(ys)) / height)

# glTF does not describe Blender's Layer Weight atmosphere; recreate it in JS.
atmosphere = bpy.data.objects["MARS | atmosphere rim"]
atmosphere["marshelAtmosphere"] = True
material = bpy.data.materials.new("Mars | web atmosphere placeholder")
nodes = material.node_tree.nodes
shader = nodes.get("Principled BSDF")
shader.inputs["Base Color"].default_value = (1, 0.25, 0.04, 1)
shader.inputs["Alpha"].default_value = 0
material.surface_render_method = "DITHERED"
atmosphere.data.materials.clear()
atmosphere.data.materials.append(material)

# Store the area-light configuration; Three.js recreates it with RectAreaLights.
scene["marshelStudioLights"] = json.dumps([
    {"name": obj.name, "energy": obj.data.energy, "color": list(obj.data.color),
     "size": obj.data.size, "position": list(obj.location), "rotation": list(obj.rotation_euler)}
    for obj in visible if obj.type == "LIGHT"
])
scene["marshelWorldStrength"] = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND").inputs["Strength"].default_value

# Backdrop is replaced with the site's full-screen background; omit studio lights
# from glTF since AREA lights are not supported by KHR_lights_punctual.
bpy.ops.object.select_all(action="DESELECT")
for obj in visible:
    if obj.type != "LIGHT" and obj.name != "Studio | matte shadow backdrop":
        obj.select_set(True)
scene.frame_set(1)
glb = models / "marshel-intro-v1.glb"
bpy.ops.export_scene.gltf(
    filepath=str(glb), export_format="GLB", use_selection=True,
    use_active_scene=True, export_cameras=True, export_lights=False,
    export_extras=True, export_apply=True, export_animations=True,
    export_animation_mode="SCENE", export_anim_scene_split_object=False,
    export_frame_range=True, export_force_sampling=True, export_frame_step=1,
    export_anim_slide_to_zero=True, export_bake_animation=True,
    export_optimize_animation_size=True, export_image_format="AUTO",
    export_meshopt_compression_enable=True, export_meshopt_extension="EXT_meshopt_compression",
)
data = glb.read_bytes()
length = struct.unpack_from("<I", data, 12)[0]
gltf = json.loads(data[20:20 + length])
assert len(gltf.get("animations", [])) == 1, "Expected one complete scene animation"
assert len(gltf.get("cameras", [])) == 1, "Expected original orthographic camera"
report = {
    "source": source.name, "source_sha256": source_hash,
    "source_unchanged": hashlib.sha256(source.read_bytes()).hexdigest() == source_hash,
    "frames": [1, 192], "fps": 24, "playback_seconds": 4,
    "glb_bytes": len(data), "nodes": len(gltf["nodes"]),
    "meshes": len(gltf["meshes"]), "animation_channels": len(gltf["animations"][0]["channels"]),
    "baked_images": textures,
}
assert report["source_unchanged"]
(models / "marshel-intro-v1.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("EXPORT_REPORT=" + json.dumps(report))
