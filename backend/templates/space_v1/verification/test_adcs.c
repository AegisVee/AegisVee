
#include "unity.h"
#include "adcs_control.h"

void setUp(void) {
    // set stuff up here
    adcs_init();
}

void tearDown(void) {
    // clean stuff up here
}

void test_adcs_loop_timing(void) {
    // Verify that the loop time is set correctly
    TEST_ASSERT_EQUAL_INT(100, ADCS_LOOP_PERIOD_MS);
}

void test_reaction_wheel_command(void) {
    // Test reaction wheel torque command generation
    float torque_cmd = calculate_torque(0.1, 0.05); // error, rate
    TEST_ASSERT_FLOAT_WITHIN(0.001, 1.5, torque_cmd); // Expected 1.5 Nm
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_adcs_loop_timing);
    RUN_TEST(test_reaction_wheel_command);
    return UNITY_END();
}
