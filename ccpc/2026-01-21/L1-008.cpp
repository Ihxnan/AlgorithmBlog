// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805135224455168
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int a, b;
    int sum = 0;
    cin >> a >> b;
    for (int i = a; i <= b; ++i)
        cout << setw(5) << i << "\n"[(i - a + 1) % 5 && i != b], sum += i;
    cout << "Sum = " << sum << endl;
}
