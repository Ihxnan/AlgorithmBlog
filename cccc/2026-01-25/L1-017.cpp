// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805121500692480
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    string str;
    cin >> str;
    double cnt = 0;
    for (auto &p : str)
        cnt += p == '2';
    double ans = cnt / (str.size() - (str.front() == '-'));
    if (str.front() == '-')
        ans *= 1.5;
    if (str.back() % 2 == 0)
        ans *= 2;
    cout << fixed << setprecision(2) << ans * 100 << "%" << endl;
}
