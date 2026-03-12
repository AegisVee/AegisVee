from behave import fixture, use_fixture

def before_scenario(context, scenario):
    # Setup context variables
    context.ai_response = None
    context.generated_file = None
    context.generated_code = None
    context.validation_result = None
    context.node_status = None
    context.project_context = {}
    context.current_node = None
