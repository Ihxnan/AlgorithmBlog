// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805132040978432
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    vi arr(3);
    cin >> arr;
    sort(all(arr));
    for (int i = 0; i < 3; ++i)
        cout << arr[i] << (i < 2 ? "->" : "");
}
