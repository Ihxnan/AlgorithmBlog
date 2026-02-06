// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805083282194432
#include "../../template.cpp"

void init()
{
    cin >> t;
}

void solve()
{
    string str;
    int hu, mai;
    cin >> str >> hu >> mai;
    if (hu < 15 || hu > 20 || mai < 50 || mai > 70)
        cout << str << endl;
}
