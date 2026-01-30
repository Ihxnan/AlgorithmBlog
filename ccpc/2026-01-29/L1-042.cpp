// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805088529268736
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    string str;
    cin >> str;
    cout << str.substr(6, 4) + '-' + str.substr(0, 3) + str.substr(3, 2) << endl;
}
