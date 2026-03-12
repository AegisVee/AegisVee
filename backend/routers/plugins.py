"""
Plugin Management Router — Install, uninstall, and query AI plugin packages.

Endpoints:
  GET    /api/plugins               — List all plugins (registry + state)
  GET    /api/plugins/{id}/status   — Get plugin status
  POST   /api/plugins/{id}/install  — Install a plugin
  POST   /api/plugins/{id}/uninstall — Uninstall a plugin
"""

from fastapi import APIRouter, HTTPException
import plugin_service

router = APIRouter(prefix="/api/plugins", tags=["Plugins"])


@router.get("/")
def list_all_plugins():
    """List all plugins with their current status."""
    return plugin_service.list_plugins()


@router.get("/{plugin_id}/status")
def get_plugin_status(plugin_id: str):
    """Get status of a specific plugin."""
    plugin = plugin_service.get_plugin(plugin_id)
    if not plugin:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")
    return plugin


@router.post("/{plugin_id}/install")
async def install_plugin(plugin_id: str):
    """Install a plugin (downloads model for model plugins)."""
    result = await plugin_service.install_plugin(plugin_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/{plugin_id}/uninstall")
async def uninstall_plugin(plugin_id: str):
    """Uninstall a plugin."""
    result = await plugin_service.uninstall_plugin(plugin_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
